import { Component } from '@angular/core';
import { RandomService } from './services/random.service';
import { CharModel, MapModel, ModeEnum, ModeModel, RepeatModeEnum, SpinTypeEnum } from './model/random.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Leandro se la come';
  repeatEnumArray = RandomService.GenerateRepeatModeList();
  repeatEnum = RepeatModeEnum;
  spinTypeEnum = SpinTypeEnum;
  modeEnumArray = RandomService.GenerateModeList();
  teams: { teamNum: number, chars: CharModel[] }[] = [];
  charForm: FormGroup;

  constructor(private randomServ: RandomService) {
    this.charForm = new FormGroup({
      repeatMode: new FormControl(this.repeatEnum.NoRepeat, [Validators.required]),
      memberQty: new FormControl(3, [Validators.required, Validators.min(1), Validators.max(8)]),
      teamQty: new FormControl(2, [Validators.required, Validators.min(1)]),
      mapMode: new FormControl(ModeEnum.dominio, [Validators.required]),
      priority_qty: new FormControl(false)
    });
    this.charForm.get('teamQty')?.valueChanges.subscribe(x => this.startSpin(SpinTypeEnum.char));
    this.charForm.get('memberQty')?.valueChanges.subscribe(x => this.startSpin(SpinTypeEnum.char));
    this.charForm.get('repeatMode')?.valueChanges.subscribe(x => this.startSpin(SpinTypeEnum.char));
    this.charForm.get('mapMode')?.valueChanges.subscribe(x => this.startSpin(SpinTypeEnum.map));
    this.startSpin(SpinTypeEnum.all);
  }
  private startSpin(type: SpinTypeEnum) {
    if (type === SpinTypeEnum.all) {
      this.startSpinChar();
      this.startSpinMap();
      this.startSpinMode();
    }
    else {
      switch (type) {
        case SpinTypeEnum.char:
          this.startSpinChar();
          break;
        case SpinTypeEnum.map:
          this.startSpinMap();
          break;
        case SpinTypeEnum.mode:
          this.startSpinMode();
          break;
      }
    }
  }
  private startSpinChar() {
    if (this.charForm.get('teamQty')?.valid && this.charForm.get('memberQty')?.valid && this.charForm.get('repeatMode')?.valid) {
      this.teams = this.randomServ.getRandomTeams(this.charForm.get('teamQty')?.value, this.charForm.get('memberQty')?.value, this.charForm.get('repeatMode')?.value);
      setTimeout(() => {
        this.init(SpinTypeEnum.char);
      });
    }
    else {
      this.teams = [];
    }
  }
  private startSpinMap() {
    this.init(SpinTypeEnum.map);
  }
  private startSpinMode() {
    this.init(SpinTypeEnum.mode);
  }
  public init(type: SpinTypeEnum) {
    let doors = Array.from(document.querySelectorAll(`.${SpinTypeEnum[type]}-door`));
    for (const door of doors) {
      (door as HTMLElement).dataset['spinned'] = '0';

      const boxes = door.querySelector(`.${SpinTypeEnum[type]}-boxes`) as HTMLElement;
      const boxesClone = boxes.cloneNode(false);
      const pool = ['❓'];

      switch (type) {
        case SpinTypeEnum.char:
          pool.push(...this.randomServ.Shuffle(RandomService.GenerateCharList() as []).map(x => (x as CharModel).value));
          pool.push(this.teams.find(x => x.teamNum === Number(door.parentElement?.getAttribute('data')))?.chars[Number(door.getAttribute('data') as string)].value as string)
          break;
        case SpinTypeEnum.map:
          let maps = this.randomServ.Shuffle(RandomService.GenerateMapList() as []);
          let filteredMaps = maps.filter(x => (x as MapModel).mode === this.charForm.get('mapMode')?.value).map(x => (x as MapModel).map)
          pool.push(...maps.map(x => (x as MapModel).map));
          pool.push(...filteredMaps);
          break;
        case SpinTypeEnum.mode:
          let modes = this.randomServ.Shuffle(RandomService.GenerateModeList() as []);
          pool.push(...modes.map((x: ModeModel) => x.value));
          if (this.charForm.get('priority_qty')?.value) {
            if ((modes as ModeModel[])[modes.length - 1].member_qty !== this.charForm.get('memberQty')?.value || (modes as ModeModel[])[modes.length - 1].team_qty !== this.charForm.get('teamQty')?.value) {
              let modeIndex = modes.findIndex((x: ModeModel) => x.member_qty === this.charForm.get('memberQty')?.value && x.team_qty === this.charForm.get('teamQty')?.value);
              pool.push((modes[modeIndex] as ModeModel).value);
            }
          }
          break;
      }

      boxesClone.addEventListener(
        'transitionstart',
        function () {
          (door as HTMLElement).dataset['spinned'] = '1';
          Array.from(document.querySelectorAll(`.${SpinTypeEnum[type]}-box`), element => element as HTMLElement).forEach((box: HTMLElement) => {
            box.style.filter = 'blur(1px)';
          });
        },
        { once: true }
      );

      boxesClone.addEventListener(
        'transitionend',
        function () {
          Array.from(document.querySelectorAll(`.${SpinTypeEnum[type]}-box`), element => element as HTMLElement).forEach((box) => {
            box.style.filter = 'blur(0)';
          });
        },
        { once: true }
      );

      for (let i = pool.length - 1; i >= 0; i--) {
        const box = document.createElement('div');
        box.classList.add(`${SpinTypeEnum[type]}-box`);
        box.style.width = door.clientWidth + 'px';
        box.style.height = door.clientHeight + 'px';
        box.innerHTML = pool[i];
        boxesClone.appendChild(box);
      }
      (boxesClone as HTMLElement).style.transitionDuration = `3s`;
      (boxesClone as HTMLElement).style.transform = `translateY(-${door.clientHeight * (pool.length - 1)}px)`;
      door.replaceChild(boxesClone, boxes);
    }
  }

  public spinAll() {
    this.spin(SpinTypeEnum.mode);
    setTimeout(() => {
      this.spin(SpinTypeEnum.map);
      this.teams = this.randomServ.getRandomTeams(this.charForm.get('teamQty')?.value, this.charForm.get('memberQty')?.value, this.charForm.get('repeatMode')?.value);
      this.spin(SpinTypeEnum.char);
    }, 3500);
  }
  public spin(type: SpinTypeEnum) {
    if (type === this.spinTypeEnum.char && this.charForm.status == 'INVALID') {
      alert('Hay errores');
      return;
    }

    switch (type) {
      case SpinTypeEnum.char:
        this.teams = this.randomServ.getRandomTeams(this.charForm.get('teamQty')?.value, this.charForm.get('memberQty')?.value, this.charForm.get('repeatMode')?.value);
        this.init(SpinTypeEnum.char);
        break;
      case SpinTypeEnum.map:
        this.init(SpinTypeEnum.map);
        break;
      case SpinTypeEnum.mode:
        this.init(SpinTypeEnum.mode);
        break;
    }
    let mode = this.modeEnumArray;
    setTimeout(async () => {
      let doors = Array.from(document.querySelectorAll(`.${SpinTypeEnum[type]}-door`));

      for (const door of doors) {
        const boxes = door.querySelector(`.${SpinTypeEnum[type]}-boxes`) as HTMLElement;
        const duration = parseInt(boxes.style.transitionDuration);
        boxes.style.transform = 'translateY(0)';
        await new Promise((resolve) => setTimeout(resolve, duration * 100));
        setTimeout(() => {
          if (type === SpinTypeEnum.mode) {
            let selectMode = mode.find(x => x.corrected_name == door.firstChild?.firstChild?.textContent);
            this.charForm.get('mapMode')?.setValue(selectMode?.name);
            switch (selectMode?.value) {
              case ModeEnum.dominio:
                this.charForm.get('teamQty')?.setValue(2);
                this.charForm.get('memberQty')?.setValue(3);
                break;
              case ModeEnum.duelo:
                this.charForm.get('teamQty')?.setValue(2);
                this.charForm.get('memberQty')?.setValue(1);
                break;
              case ModeEnum.galleta_magica_de_la_fortuna:
                this.charForm.get('teamQty')?.setValue(1);
                this.charForm.get('memberQty')?.setValue(8);
                break;
              case ModeEnum.battle_royale:
                this.charForm.get('teamQty')?.setValue(1);
                this.charForm.get('memberQty')?.setValue(8);
                break;
              case ModeEnum.guardia_de_la_corona:
                this.charForm.get('teamQty')?.setValue(2);
                this.charForm.get('memberQty')?.setValue(3);
                break;
              case ModeEnum.muerte_por_equipo:
                this.charForm.get('teamQty')?.setValue(2);
                this.charForm.get('memberQty')?.setValue(3);
                break;
              case ModeEnum.muerte_por_parejas:
                this.charForm.get('teamQty')?.setValue(2);
                this.charForm.get('memberQty')?.setValue(2);
                break;
              case ModeEnum.touch_down_duo:
                this.charForm.get('teamQty')?.setValue(2);
                this.charForm.get('memberQty')?.setValue(2);
                break;
              case ModeEnum.touch_down_equipo:
                this.charForm.get('teamQty')?.setValue(2);
                this.charForm.get('memberQty')?.setValue(3);
                break;
            }
          }
        }, 3020);
      }
    });
  }
}
