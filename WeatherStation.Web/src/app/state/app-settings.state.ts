
import { Injectable } from '@angular/core';
import { Action, State, StateContext } from '@ngxs/store';
import { UpdateTemperatureUnit } from '../actions/update-temperature-unit.action';
import { AppSettings } from './app-settings.interface';

@State<AppSettings>({
    name: 'appSettings',
    defaults: {
        temperatureUnit: 'F'
    }
})
@Injectable()
export class AppSettingsState {
    @Action(UpdateTemperatureUnit)
    updateTemperatureUnit(ctx: StateContext<AppSettings>, action: UpdateTemperatureUnit) {
        const state = ctx.getState();

        ctx.setState({
            ...state,
            temperatureUnit: action.unit
        });
    }
}