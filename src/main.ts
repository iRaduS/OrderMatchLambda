import { Handler, APIGatewayProxyEvent, Context } from 'aws-lambda';
import { INestApplicationContext } from "@nestjs/common";
import { ContextIdFactory, NestFactory } from "@nestjs/core";
import * as dotenv from 'dotenv';

import { DeliveryRouteAlgorithmService } from "./services/deliveryRouteAlgorithm.service";
import { LambdaStructureResponseType, RequestDataType } from "./types/lambdaBase.type";
import { AppModule } from "./app.module";

let lambdaApplicationContext: INestApplicationContext;

export const bootstrap = async (): Promise<INestApplicationContext> => {
  if (lambdaApplicationContext){
    return lambdaApplicationContext;
  }

  dotenv.config({ path: './.env', override: true });
  lambdaApplicationContext = await NestFactory.createApplicationContext(AppModule, {});

  return lambdaApplicationContext;
}

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context) => {
  const getCurrentRequest: Record<string, unknown> & LambdaStructureResponseType = processLambdaRequest(event);

  if (! getCurrentRequest.processed) {
    if (getCurrentRequest.statusCode !== 200) {
      console.error(getCurrentRequest);
    }

    return getCurrentRequest;
  }

  const appInstance: INestApplicationContext = await bootstrap();
  const contextId = ContextIdFactory.create();
  appInstance.registerRequestByContextId({ context }, contextId);

  const deliveryRouteAlgorithmService = await appInstance.resolve<DeliveryRouteAlgorithmService>(
    DeliveryRouteAlgorithmService, contextId
  );

  const result = await deliveryRouteAlgorithmService.startAllocationAlgorithm(event.body as unknown as RequestDataType)
  return { statusCode: 200, body: JSON.stringify(result) }
}

const processLambdaRequest = (event: APIGatewayProxyEvent): Record<string, unknown> & LambdaStructureResponseType => {
  if (event.path === '/health' && event.httpMethod === 'GET') {
    return { statusCode: 200, body: JSON.stringify({ serviceStatus: 'connected' }) };
  }

  if (! event.body) {
    return { statusCode: 400, body: JSON.stringify({ message: 'invalid body (empty)' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 400, body: JSON.stringify({ message: 'invalid http method' }) }
  }

  const result: Record<string, unknown> & LambdaStructureResponseType = { processed: true };
  try {
    result.body = JSON.parse(event.body);
  } catch (error) {
    return { statusCode: 400, body: JSON.stringify({ message: `invalid body (parsing error) ${error}` }) };
  }

  return result;
}
