import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  texts: string[][] = [[],[]]; // textos divididos en substrings
  currentText: number = 0; // texto al que pertenece el subtring que se esta mostrando
  currentSub: number = 0; // substring que se muestra en pantalla
  instructions: string= ""; // instrucciones del juego
  substringInput: number[][][]; // lleva la cantidad de veces que se ingreso cada letra: [texto][substring][cant. letra]
  substringScore: number[][][]; // lleva el puntaje de cada substring: [texto][substring][puntaje por letra]
  substringSound: number[][][]; // indica que sonido suena cuando se apreta x tecla en y substring de z texto
  substringValue: number[][][];
  minValues: number[][][]; // puntaje minimo del substring para pasar al siguiente
  
  //audios: Audio[] = [];
  alreadyShown: string = "";
  playerInput: string = ""; // lo que el jugador esta ingresando en tiempo real


  audios: HTMLAudioElement[] = []; // coleccion de todos los audios

  constructor() { 
    this.substringInput=[];
    this.substringScore=[];
    this.substringSound=[];
    this.substringValue=[];
    this.minValues=[];
  }

  ngOnInit(){
    this.fetchTexts().then( () =>
      this.fetchSound()
    ).then( () => {
      this.initializeMatrixes();
      this.setMinValues();
      this.setSounds();
      this.setSubstringValues();
      document.addEventListener( 'keydown', (event) => {
        this.processInput(event.key);
      });
    }
    );
  }
  
  
  setSubstringValues() {
    for(let t = 0; t<this.texts.length; t++){
      for(let s = 0; s<this.texts[t].length; s++){
        for(let i:number=0; i<this.texts[t][s].length; i++){
          if (65<=this.texts[t][s].charCodeAt(i) && this.texts[t][s].charCodeAt(i)<=90){ // mayusculas
            this.substringValue[t][s][this.texts[t][s].charCodeAt(i)-55]+=1;
          }else if (97<=this.texts[t][s].charCodeAt(i) && this.texts[t][s].charCodeAt(i)<=122){ // minusculas
            this.substringValue[t][s][this.texts[t][s].charCodeAt(i)-87]+=1;
          }else if (48<=this.texts[t][s].charCodeAt(i) && this.texts[t][s].charCodeAt(i)<=57){ // numeros
            this.substringValue[t][s][this.texts[t][s].charCodeAt(i)-48]+=1;
          }
        }
      }
    }
    console.log('values: ',this.substringValue[0]);
  }
  
  async setSounds() {
    let result = await fetch('/assets/texts/indiceAudios.txt').then(data => data.text());
    let instances = result.match(/.*Audio\.txt/g);
    for (let i=0; i<instances!.length; i++){
      let j=0;
      await fetch('/assets/texts/'+instances![i]).then( data => data.text() ).then( text => {
        let arrays = text.match(/\[(.*)\]/g);
        arrays!.forEach( value => {
          this.substringSound[i][j]=this.textToValues(value);
          j++;
        });
      });
    }
  }

  async setMinValues() {
    let result = await fetch('/assets/texts/indiceValores.txt').then(data => data.text());
    let instances = result.match(/.*Valores\.txt/g);
    for (let i=0; i<instances!.length; i++){
      let j=0;
      await fetch('/assets/texts/'+instances![i]).then( data => data.text() ).then( text => {
        let arrays = text.match(/\[(.*)\]/g);
        arrays!.forEach( value => {
          this.minValues[i][j]=this.textToValues(value);
          j++;
        });
      });
    }
  }
  
  textToValues(value: string): number[] {
    let valuesArray: number[] = [];
    value.split(/\[|\]/)[1].split(',').forEach(value => valuesArray.push(+value));
    return valuesArray;
  }

  async fetchTexts(){
    await fetch('/assets/texts/instrucciones.txt').then( data => data.text() ).then(text => this.instructions=text);
    let result = await fetch('/assets/texts/indice.txt').then(data => data.text());
    let instances = result.match(/([a-z]*[A-Z]*[0-9]*)*\.txt/g);
    for (let i=0; i<instances!.length; i++){
      let j=0;
      await fetch('/assets/texts/'+instances![i]).then( data => data.text() ).then( text => {
        this.textToFrases(text).forEach( frase => {
          this.texts[i][j]=frase
          j++;
        });
      });
    }
  }

  textToFrases(text: string): string[]{
    let ret: string[] = [];
    text.split(/\|\|\|/).forEach(frase => {
      ret.push(frase);
    });
    return ret;
  }

  async fetchSound(){
    let result: string = "";
    await fetch('/assets/sounds/audios.txt').then( data => data.text() ).then( text => result=text);
    let instances = result.match(/(.*\.wav)/g);
    for (let i=0; i<instances!.length; i++){
      this.audios.push(new Audio('/assets/sounds/'+instances![i]));
    }
  }

  processInput(text: string){
    for(let i:number=0; i<text.length; i++){
      if (65<=text.charCodeAt(i) && text.charCodeAt(i)<=90){ // mayusculas
          this.substringInput[this.currentText][this.currentSub][text.charCodeAt(i)-55]+=1;
          if (this.substringSound[this.currentText][this.currentSub][text.charCodeAt(i)-55]!==0) this.audios[this.substringSound[this.currentText][this.currentSub][text.charCodeAt(i)-55]].play();
      }else if (97<=text.charCodeAt(i) && text.charCodeAt(i)<=122){ // minusculas
          this.substringInput[this.currentText][this.currentSub][text.charCodeAt(i)-87]+=1;
          if (this.substringSound[this.currentText][this.currentSub][text.charCodeAt(i)-87]!==0) this.audios[this.substringSound[this.currentText][this.currentSub][text.charCodeAt(i)-87]].play();
      }else if (48<=text.charCodeAt(i) && text.charCodeAt(i)<=57){ // numeros
          this.substringInput[this.currentText][this.currentSub][text.charCodeAt(i)-48]+=1;
          if (this.substringSound[this.currentText][this.currentSub][text.charCodeAt(i)-48]!==0) this.audios[this.substringSound[this.currentText][this.currentSub][text.charCodeAt(i)-48]].play();
      }
    }
    this.playerInput=""
    this.calculateScore();
  }

  initializeMatrixes(){
    for(let t = 0; t<this.texts.length; t++){
      this.substringInput[t]=new Array();
      this.substringScore[t]=new Array();
      this.substringSound[t]=new Array();
      this.substringValue[t]=new Array();
      this.minValues[t]=new Array();
      for(let s = 0; s<this.texts[t].length; s++){
        this.substringInput[t][s]=new Array();
        this.substringScore[t][s]=new Array();
        this.substringSound[t][s]=new Array();
        this.substringValue[t][s]=new Array();
        this.minValues[t][s]=new Array();
        for(let n = 0; n<37; n++){
          this.substringInput[t][s][n]=0;
          this.substringScore[t][s][n]=0;
          this.substringSound[t][s][n]=0;
          this.substringValue[t][s][n]=0;
          this.minValues[t][s][n]=0;
        }
      }
    }
  }

  calculateScore(){
    let ret = true;
    for(let i = 0; i<this.substringScore[0][0].length; i++){
      if(this.substringValue[this.currentText][this.currentSub][i]!==0){
        this.substringScore[this.currentText][this.currentSub][i]=
          this.substringInput[this.currentText][this.currentSub][i] /
          this.substringValue[this.currentText][this.currentSub][i];
      }else{
        this.substringScore[this.currentText][this.currentSub][i]=1;
      }
    }
    let index=0;
    while(ret && index<this.substringScore[0][0].length){
      ret=this.substringScore[this.currentText][this.currentSub][index]>=this.minValues[this.currentText][this.currentSub][index];
      index++;
    }
    console.log(this.substringScore[this.currentText][this.currentSub]);
    console.log(this.minValues[this.currentText][this.currentSub]);
    if (ret) this.nextSub();
  }

  nextSub(){
    if(this.currentSub<this.texts[this.currentText].length-1){
      this.alreadyShown+=this.texts[this.currentText][this.currentSub];
      this.currentSub++;
    }else if(this.currentText<this.texts.length-1){
      this.currentText++;
      this.currentSub=0;
    }else{
      //something something
    }
  }

  // determineColor(text: string): string{
  //   let newText = "";
  //   text.split(' ').forEach( word => {
  //     let aux = word.match(/\[(.)\/([b|g|r|y])\]/gm);
  //     let color = "";
  //     if(aux){
  //       aux.forEach( values => {
  //         let data = values.match(/(.)\/(.)/);
  //         if (data![2]=="r") {
  //           color='red';
  //         }else if (data![2]=="g") {
  //           color='green';
  //         }
  //         else if (data![2]=="b") {
  //           color='blue';
  //         }
  //         else if (data![2]=="y") {
  //           color='yellow';
  //         }
  //         let regex = new RegExp('\\['+data![1]+'\/'+data![2]+'\\]');
  //         word = word.replace(regex, '<span style=color:'+color+'>'+data![1]+'</span>');
  //       });
  //     }
  //     newText += word+' ';
  //   });
  //   return newText;
  // }
}
