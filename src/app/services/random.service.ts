import { Injectable } from '@angular/core';
import { CharEnum, CharModel, RepeatModeEnum, MapEnum, ModeEnum, MapModel, ModeModel } from '../model/random.model';

@Injectable({
  providedIn: 'root'
})
export class RandomService {

  constructor() { }

  public getRandomTeams(TeamQty: number, TeamMemberQty: number, RepeatMode: RepeatModeEnum): { teamNum: number, chars: CharModel[] }[] {
    return this.shuffleChars(TeamQty, TeamMemberQty, RepeatMode);
  }

  public getRandomChars(TeamQty: number, TeamMemberQty: number, RepeatMode: RepeatModeEnum): CharModel[] {
    return this.shuffleChars(TeamQty, TeamMemberQty, RepeatMode).flatMap(x => x.chars);
  }

  private shuffleChars(TeamQty: number, TeamMemberQty: number, RepeatMode: RepeatModeEnum) {
    const ListReturn: { teamNum: number, chars: CharModel[] }[] = [];

    let allChars: CharModel[] = this.Shuffle(RandomService.GenerateCharList() as []);
    for (let i = 0; i < TeamQty; i++) {
      const team: CharModel[] = [];
      for (let f = 0; f < TeamMemberQty; f++) {
        let MemberIndex = 0;
        let loopChar = allChars[MemberIndex];
        switch (RepeatMode) {
          case RepeatModeEnum.RepeatAny:
            allChars = this.Shuffle(RandomService.GenerateCharList() as []);
            loopChar = allChars[0];
            break;
          case RepeatModeEnum.RepeatFullTeam:
            if (ListReturn.findIndex(x => x.chars.findIndex(y => y.value == loopChar.value) > -1) > -1) {
              MemberIndex += i;
            }
            loopChar = allChars[MemberIndex];
            break;
          case RepeatModeEnum.RepeatAll:
            loopChar = allChars[0];
            break;
          case RepeatModeEnum.NoRepeat:
            allChars = this.Shuffle(RandomService.GenerateCharList() as []);
            while (ListReturn.findIndex(x => x.chars.findIndex(y => y.value == loopChar.value) > -1) > -1 || team.findIndex(x => x.value == loopChar.value) > -1) {
              MemberIndex++;
              loopChar = allChars[MemberIndex];
            }
            break;
          case RepeatModeEnum.NoRepeatTeam:
            allChars = this.Shuffle(RandomService.GenerateCharList() as []);
            while (team.findIndex(x => x.value == loopChar.value) > -1) {
              MemberIndex++;
              loopChar = allChars[MemberIndex];
            }
            break;
        }
        team.push(loopChar);
      }
      ListReturn.push({ teamNum: i, chars: team });
    }
    return ListReturn;
  }

  public Shuffle(chars: []): [] {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }
    return chars;
  }

  public static GenerateCharList(): CharModel[] {
    return Object.keys(CharEnum).map(x => ({ value: CharEnum[x as keyof typeof CharEnum], name: x }));
  }

  public static GenerateRepeatModeList(): { key: string, name: string }[] {
    return Object.keys(RepeatModeEnum).map(x => ({ key: x, name: RepeatModeEnum[x as keyof typeof RepeatModeEnum] }));
  }

  public static GenerateMapList(): MapModel[] {
    let modes = this.GenerateModeList();
    return Object.keys(MapEnum).map(x => ({ map: MapEnum[x as keyof typeof MapEnum], name: x, mode: modes.filter(y => x.includes(y.name))[0].name }));
  }

  public static GenerateModeList(): ModeModel[] {
    return Object.keys(ModeEnum).map(x => ({
      value: ModeEnum[x as keyof typeof ModeEnum], name: x, corrected_name: x.replaceAll('_', ' ').replace(
        /\w\S*/g,
        function (txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
      )
    }));
  }
}