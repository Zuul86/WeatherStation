export interface WeatherDataModel {
    readingTime: Date;
    barametricPressure?: number | null;
    tempurature?: number | null;
    humidity?: number | null;
};