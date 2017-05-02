import { Component, Input, ViewChild, ElementRef} from "@angular/core";
import {Chose} from "@NoyauFonctionnel/nf";

/*
On a ajouté une icone de "son" proposée par le site font awesome.
On a associé à cette icone la méthode textToSpeech() dès que l'on clique dessus.
 */
const htmlTemplate = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
	<div class="view">
		<input 	class			= "toggle" 
				type			= "checkbox" 
				name			= "fait"
				[ngModel]="nf.fait"
				(ngModelChange)="nf.Fait($event)"/>
		<label 	class="texte" (dblclick)="modeEdition()">{{nf.texte}} <i class="fa fa-volume-up" (click)="textToSpeech()"></i></label>
		<button class="destroy" (click)="nf.dispose()"></button>
	</div>
	<form *ngIf="editing" (ngSubmit)="setText(newText.value)">
		<input 	class="edit" [ngModel]="nf.texte" name="newText" #newText (blur)="setText(newText.value)"/>
	</form>
`;

@Component({
  selector		: "item-chose",
  template		: htmlTemplate
})
export class ItemChose {
    @Input ("nf" ) nf   : Chose;
	@ViewChild("newText") newTextInput : ElementRef;
	editing			    : boolean = false;

	//constructor() {}
    modeEdition() {
        this.editing = true;
        requestAnimationFrame(() => {
            this.newTextInput.nativeElement.focus();
        });
    }

    setText(txt: string) {
        this.editing=false;
        //console.log("On tue tout");
        if(txt==="") {
            this.nf.dispose();
        } else {this.nf.Texte(txt);}
    }
    /*
    Dès que l'on clique sur une icone "son", txtToSpeech() va lire la chose qui lui est associée.
    On a défini quelques paramètres. La voix est légèrement différente si l'on fait une synthèse vocale
    chose par chose ou sur toute la liste (voir ListChoses.ts).
     */
    textToSpeech() {
            let msg = new SpeechSynthesisUtterance();
            msg.volume = 1;
            msg.rate = 1;
            msg.pitch = 2;
            msg.text = this.nf.texte;
            msg.lang = "fr-FR";
            window.speechSynthesis.speak(msg);
    }
}
