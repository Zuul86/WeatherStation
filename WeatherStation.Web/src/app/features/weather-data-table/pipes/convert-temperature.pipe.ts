import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convertTemperature'
})
export class ConvertTemperaturePipe implements PipeTransform {

  transform(temperatureInCelcius: number, temperatureUnit: string): number | null {
    const temp = temperatureUnit === "F" && temperatureInCelcius ? 
      (temperatureInCelcius * 1.8) + 32 : 
      temperatureInCelcius;

    return temp ? Math.round(temp) : null;
  }
}
