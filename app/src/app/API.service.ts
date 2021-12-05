/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from "@angular/core";
import API, { graphqlOperation, GraphQLResult } from "@aws-amplify/api-graphql";
import { Observable } from "zen-observable-ts";

export type WeatherData = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type TableWeatherDataFilterInput = {
  time?: TableIntFilterInput | null;
  sensor_bp?: TableFloatFilterInput | null;
  sensor_t?: TableFloatFilterInput | null;
  sensor_h?: TableFloatFilterInput | null;
};

export type TableIntFilterInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  contains?: number | null;
  notContains?: number | null;
  between?: Array<number | null> | null;
};

export type TableFloatFilterInput = {
  ne?: number | null;
  eq?: number | null;
  le?: number | null;
  lt?: number | null;
  ge?: number | null;
  gt?: number | null;
  contains?: number | null;
  notContains?: number | null;
  between?: Array<number | null> | null;
};

export type WeatherDataConnection = {
  __typename: "WeatherDataConnection";
  items?: Array<WeatherData | null> | null;
  nextToken?: string | null;
};

export type GetWeatherDataQuery = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type ListWeatherDataQuery = {
  __typename: "WeatherDataConnection";
  items?: Array<{
    __typename: "WeatherData";
    time: number;
    sensor_bp?: number | null;
    sensor_t?: number | null;
    sensor_h?: number | null;
  } | null> | null;
  nextToken?: string | null;
};

@Injectable({
  providedIn: "root"
})
export class APIService {
  async GetWeatherData(time: number): Promise<GetWeatherDataQuery> {
    const statement = `query GetWeatherData($time: Int!) {
        getWeatherData(time: $time) {
          __typename
          time
          sensor_bp
          sensor_t
          sensor_h
        }
      }`;
    const gqlAPIServiceArguments: any = {
      time
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <GetWeatherDataQuery>response.data.getWeatherData;
  }
  async ListWeatherData(
    filter?: TableWeatherDataFilterInput,
    limit?: number,
    nextToken?: string
  ): Promise<ListWeatherDataQuery> {
    const statement = `query ListWeatherData($filter: TableWeatherDataFilterInput, $limit: Int, $nextToken: String) {
        listWeatherData(filter: $filter, limit: $limit, nextToken: $nextToken) {
          __typename
          items {
            __typename
            time
            sensor_bp
            sensor_t
            sensor_h
          }
          nextToken
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (filter) {
      gqlAPIServiceArguments.filter = filter;
    }
    if (limit) {
      gqlAPIServiceArguments.limit = limit;
    }
    if (nextToken) {
      gqlAPIServiceArguments.nextToken = nextToken;
    }
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <ListWeatherDataQuery>response.data.listWeatherData;
  }
}
