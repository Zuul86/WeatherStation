export interface WeatherDataModel {
    readingTime: Date;
    barametricPressure?: number | null;
    temperature?: number | null;
    humidity?: number | null;
};