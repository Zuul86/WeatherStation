/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.
import { Injectable } from "@angular/core";
import API, { graphqlOperation, GraphQLResult } from "@aws-amplify/api-graphql";
import { Observable } from "zen-observable-ts";

export interface SubscriptionResponse<T> {
  value: GraphQLResult<T>;
}

export type __SubscriptionContainer = {
  onCreateWeatherData: OnCreateWeatherDataSubscription;
  onUpdateWeatherData: OnUpdateWeatherDataSubscription;
  onDeleteWeatherData: OnDeleteWeatherDataSubscription;
};

export type CreateWeatherDataInput = {
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type WeatherData = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type UpdateWeatherDataInput = {
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type DeleteWeatherDataInput = {
  time: number;
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

export type CreateWeatherDataMutation = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type UpdateWeatherDataMutation = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type DeleteWeatherDataMutation = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
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

export type OnCreateWeatherDataSubscription = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type OnUpdateWeatherDataSubscription = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

export type OnDeleteWeatherDataSubscription = {
  __typename: "WeatherData";
  time: number;
  sensor_bp?: number | null;
  sensor_t?: number | null;
  sensor_h?: number | null;
};

@Injectable({
  providedIn: "root"
})
export class APIService {
  async CreateWeatherData(
    input: CreateWeatherDataInput
  ): Promise<CreateWeatherDataMutation> {
    const statement = `mutation CreateWeatherData($input: CreateWeatherDataInput!) {
        createWeatherData(input: $input) {
          __typename
          time
          sensor_bp
          sensor_t
          sensor_h
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <CreateWeatherDataMutation>response.data.createWeatherData;
  }
  async UpdateWeatherData(
    input: UpdateWeatherDataInput
  ): Promise<UpdateWeatherDataMutation> {
    const statement = `mutation UpdateWeatherData($input: UpdateWeatherDataInput!) {
        updateWeatherData(input: $input) {
          __typename
          time
          sensor_bp
          sensor_t
          sensor_h
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <UpdateWeatherDataMutation>response.data.updateWeatherData;
  }
  async DeleteWeatherData(
    input: DeleteWeatherDataInput
  ): Promise<DeleteWeatherDataMutation> {
    const statement = `mutation DeleteWeatherData($input: DeleteWeatherDataInput!) {
        deleteWeatherData(input: $input) {
          __typename
          time
          sensor_bp
          sensor_t
          sensor_h
        }
      }`;
    const gqlAPIServiceArguments: any = {
      input
    };
    const response = (await API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    )) as any;
    return <DeleteWeatherDataMutation>response.data.deleteWeatherData;
  }
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
  OnCreateWeatherDataListener(
    time?: number,
    sensor_bp?: number,
    sensor_t?: number,
    sensor_h?: number
  ): Observable<
    SubscriptionResponse<Pick<__SubscriptionContainer, "onCreateWeatherData">>
  > {
    const statement = `subscription OnCreateWeatherData($time: Int, $sensor_bp: Float, $sensor_t: Float, $sensor_h: Float) {
        onCreateWeatherData(time: $time, sensor_bp: $sensor_bp, sensor_t: $sensor_t, sensor_h: $sensor_h) {
          __typename
          time
          sensor_bp
          sensor_t
          sensor_h
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (time) {
      gqlAPIServiceArguments.time = time;
    }
    if (sensor_bp) {
      gqlAPIServiceArguments.sensor_bp = sensor_bp;
    }
    if (sensor_t) {
      gqlAPIServiceArguments.sensor_t = sensor_t;
    }
    if (sensor_h) {
      gqlAPIServiceArguments.sensor_h = sensor_h;
    }
    return API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    ) as Observable<
      SubscriptionResponse<Pick<__SubscriptionContainer, "onCreateWeatherData">>
    >;
  }

  OnUpdateWeatherDataListener(
    time?: number,
    sensor_bp?: number,
    sensor_t?: number,
    sensor_h?: number
  ): Observable<
    SubscriptionResponse<Pick<__SubscriptionContainer, "onUpdateWeatherData">>
  > {
    const statement = `subscription OnUpdateWeatherData($time: Int, $sensor_bp: Float, $sensor_t: Float, $sensor_h: Float) {
        onUpdateWeatherData(time: $time, sensor_bp: $sensor_bp, sensor_t: $sensor_t, sensor_h: $sensor_h) {
          __typename
          time
          sensor_bp
          sensor_t
          sensor_h
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (time) {
      gqlAPIServiceArguments.time = time;
    }
    if (sensor_bp) {
      gqlAPIServiceArguments.sensor_bp = sensor_bp;
    }
    if (sensor_t) {
      gqlAPIServiceArguments.sensor_t = sensor_t;
    }
    if (sensor_h) {
      gqlAPIServiceArguments.sensor_h = sensor_h;
    }
    return API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    ) as Observable<
      SubscriptionResponse<Pick<__SubscriptionContainer, "onUpdateWeatherData">>
    >;
  }

  OnDeleteWeatherDataListener(
    time?: number,
    sensor_bp?: number,
    sensor_t?: number,
    sensor_h?: number
  ): Observable<
    SubscriptionResponse<Pick<__SubscriptionContainer, "onDeleteWeatherData">>
  > {
    const statement = `subscription OnDeleteWeatherData($time: Int, $sensor_bp: Float, $sensor_t: Float, $sensor_h: Float) {
        onDeleteWeatherData(time: $time, sensor_bp: $sensor_bp, sensor_t: $sensor_t, sensor_h: $sensor_h) {
          __typename
          time
          sensor_bp
          sensor_t
          sensor_h
        }
      }`;
    const gqlAPIServiceArguments: any = {};
    if (time) {
      gqlAPIServiceArguments.time = time;
    }
    if (sensor_bp) {
      gqlAPIServiceArguments.sensor_bp = sensor_bp;
    }
    if (sensor_t) {
      gqlAPIServiceArguments.sensor_t = sensor_t;
    }
    if (sensor_h) {
      gqlAPIServiceArguments.sensor_h = sensor_h;
    }
    return API.graphql(
      graphqlOperation(statement, gqlAPIServiceArguments)
    ) as Observable<
      SubscriptionResponse<Pick<__SubscriptionContainer, "onDeleteWeatherData">>
    >;
  }
}
