import {Component, Input, OnInit, ViewChild, ElementRef}    from "@angular/core";
import {Chose, ListeChoses as ListeChosesNF} 	            from "@NoyauFonctionnel/nf";
import {ListeChosesService}                                 from "@NoyauFonctionnel/service";

const htmlTemplate = `
	<section class="todoapp">
		<header class="header">
			<h1>{{titre}}</h1>
			<form (ngSubmit)="nf.Ajouter(newTodo.value); newTodo.value=''">
				<input 
				    class="new-todo"
				    placeholder="Que faire ?"
				    #newTodo 
				    autofocus/>
			</form>
		</header>
		<section class="main">
			<input  class="toggle-all" 
			        type="checkbox"
			        [ngModel]="ToutEstFait()"
			        (ngModelChange)="ToutCocherOuDecocher()"
			        />
			<label for="toggle-all">Mark all as complete</label>
			<ul class="todo-list">
			    <li *ngFor="let item of getChoses()" [class.editing]="Compo.editing">
			        <item-chose [nf]="item" #Compo>
                    </item-chose>
                </li>
            </ul>
		</section>
        <footer class="footer">
            <span class="todo-count"><strong>{{getNbRestante()}}</strong> restantes</span>
            <ul class="filters">
                <li>
                    <a class="filterAll"
                        (click)="filterCurrent=filterAll"
                        [class.selected]="filterCurrent===filterAll"
                        >Tous</a>
                </li>
                <li>
                    <a class="filterActives"
                        (click)="filterCurrent=filterActives"
                        [class.selected]="filterCurrent===filterActives">Actifs</a>
                </li>
                <li>
                    <a class="filterCompleted"
                        (click)="filterCurrent=filterCompleted"
                        [class.selected]="filterCurrent===filterCompleted">Complétés</a>
                </li>
            </ul>
            <button class="clear-completed" (click)="SupprimerCochees()">Supprimer cochées</button>
        </footer>
	</section>
	<section>
	    <div class="speechRecognition">
            <button class="myButton" (click)="speech()">Speech Recognition</button>
            <button class="myButton" (click)="textToSpeech()">Speech Synthesis</button>
        </div>
    </section>
    <section>
    <hr/>
	<div class="help">
		    Commandes vocales :
		    <ul>
		        <li>Afficher + "tout" : Affiche la liste entière</li>
		        <li>Afficher + "actif" : Affiche les tâches actives</li>
		        <li>Afficher + "complétées" : Affiche les tâches complétées</li>
		        <li>Ajouter + tâche : Ajoute la tâche</li>
		        <li>Annuler : Retire la dernière tâche</li>
		        <li>Cocher + tâche : Coche la tâche</li>
		        <li>Cocher + "tout" : Coche tous les éléments</li>
		        <li>Décocher + tâche : Décoche la tâche</li>
		        <li>Décocher + "tout" : Décoche tous les éléments</li>
		        <li>Supprimer : Supprime les éléments cochés</li>
		        <li>Supprimer + tâche : Supprime la tâche</li>
		        <li>Vider : Vide la liste</li>
            </ul>
    </div>
    </section>
	<hr/>
	<section>
	    <section *ngFor="let chose of getChoses()">
	        {{chose.fait}} : {{chose.texte}}
        </section>
	</section>
`;

export interface IWindow extends Window {
    webkitSpeechRecognition: any;
}

type filterChose = (c : Chose) => boolean;
@Component({
    selector		: "liste-choses",
    template		: htmlTemplate
})
export class ListeChoses implements OnInit {
    @Input() titre: string;
    @ViewChild("newTodo") newTextInput : ElementRef;    // Ce @ViewChild nous permet de travailler sur l'input #newTodo
    public nf: ListeChosesNF;
    filterCurrent: filterChose;
    private choses: Chose[] = [];

    constructor(private serviceListe: ListeChosesService) {
        this.filterCurrent = this.filterAll;
    };

    ngOnInit(): void {
        ListeChosesService.getData().then((nf) => {
            this.nf = nf;
            this.choses = nf.choses;
        });
    }

    getChoses(): Chose[] {
        return this.choses.filter(this.filterCurrent);
    }

    ToutEstFait(): boolean {
        return (this.choses.reduce(
                (acc, c) => acc && c.fait
                , true)
        );
    }

    ToutCocherOuDecocher() {
        let faire = !this.ToutEstFait();
        this.choses.forEach(c => c.Fait(faire));
    }

    getNbRestante(): number {
        return this.choses.filter(this.filterActives).length;
    }

    SupprimerCochees() {
        this.choses.filter(this.filterCompleted).forEach(c => c.dispose());
    }

    speech() {
        /*
        Nous ne savons pas trop pourquoi il est nécessaire de faire ce qui suit, mais ça résoud le problème de scope.
        En effet, si l'on ne déclare pas ces variables, il est impossible d'appeler les différentes méthodes créées
        dans ListeChoses.ts.
         */
        let sThis = this;
        let sChoses = this.choses;
        let sNf = this.nf;
        console.log("sChoses : " + sChoses);

        /*
        Dans un premier temps, on vérifie si le navigateur supporte la reconnaissance vocale.
         */
        if (!("webkitSpeechRecognition" in window)) {
            alert("Sorry you require a browser that supports speech recognition");
        } else {
            /*
            Si c'est le cas, on met le focus sur #newTodo 1, on "active" la reconnaissance vocale sur la page (2 et 3),
            et on défini quelques paramètres (4, 5, 6).
             */
            this.newTextInput.nativeElement.focus();    // 1
            const {webkitSpeechRecognition} : IWindow = <IWindow>window; // 2
            let recognition = new webkitSpeechRecognition(); // 3
            recognition.lang = "fr-FR"; // 4 : Sélection de la langue
            recognition.continuous = false; // 5 : Dlux en coninue à faux (on clique sur un bouton)
            recognition.interimResults = false; // 6 : Résultats intermédiaires dans la console à faux

            /*
            Nous avons donc eu des difficulté à agir sur #newTodo à cause du problème de scope mentionné plus haut.
            Pour palier à ce problème,  nous avions dans un premier temps choisi d'utiliser un variable target :
             let target = document.querySelector(".new-todo");
             qui nous permetttait, sans passer par @ViewChild, de faire ce que l'on souhaitait (inscrire les mots
             prononcés dans #newTodo.

             Ensuite, nous définissons des variables qui seront exploitées dans les différentes méthodes de reco vocale
             (onstart, onresult, onend).

                let userSentence est une string construite à partir de ce que dis l'utilisateur.

                let options est une array qui contient les différentes commandes vocales reconnues. Ces dernières sont
             tronquées afin que la forme du mot ne gêne en rien la commande ("ajoutée", "ajouter", "ajouté", "ajoute"
             permettent d'ajouter des mots).

                let keyWord correspond au premier mot de userSentence. On l'obtiendra avec un split().

             */
            let userSentence; // phrase à mettre dans l'input
            let options = ["affich", "ajout", "annul", "coch", "décoch", "lire", "supprim", "vid", "tout"];
            let keyWord;

            /*
            Ici, rien de particuler : on affiche un message comme quoi la reco vocale a commencé.
             */
            recognition.onstart = function () {
                console.log("Début de l'écoute");
            };
            /*
            Lorsque des mots sont entendus, ils sont ajoutés à userSentence (7).
            La phrase obtenue est mise en minuscule (8) ce qui nous permettra de faire reconnaître les commandes
            plus facilement (pas de souci de majuscule).
             */
            recognition.onresult = function (event) {
                userSentence = event.results[event.results.length - 1][0].transcript; // 7
                userSentence = userSentence.toLowerCase(); // 8
                console.log(userSentence);

                /*
                    Initialement, nous souhaitions donc faire apparaître le message enregistré dans l'input
                    puis travaillé à partir du message saisi.
                    Cette fonctionnalité ne s'avère au final pas nécessaire,
                    mais on a tellement galéré qu'on a décidé de la laisser.
                 */
                sThis.newTextInput.nativeElement.value = userSentence;
                console.log("target content = " + sThis.newTextInput.nativeElement.value);
            };
            /*
            C'est lorsque la reco est terminée que la majeure partie du travail a lieu :
            Dans un premier temps, on récupère le keyWord avec un split paramétré avec un espace (9 et 10)
             */
            recognition.onend = function () {
                console.log("Fin de l'écoute");
                let delimiter = " "; // 9
                keyWord = "" + userSentence.split(delimiter, 1); // 10
                console.log("keyWord = " + keyWord);

                /*
                Nous avons ensuite créer un filtre sur le tableau options (les commandes vocales reconnues) afin qu'il
                n'en reste plus qu'une (dans le filtre, 11).

                Si le filtre n'est pas vide (longueur > 0), cela signifie qu'une commande a été reconnue (12).
                On retire donc la commande de la userSentence, sans oublier l'espace (d'où le +1, 13).
                Puis nous traitons les commandes au cas par cas dans un switch (14).
                 */
                let filter = options.filter(v => v === keyWord.substring(0, v.length)); // 11
                console.log("filter = " + filter[0]);
                console.log("isFilter empty ? " + (filter.length === 0));
                if(filter.length > 0) { // 12
                    userSentence = userSentence.substr(keyWord.length + 1); // 13
                    switch (filter[0]) { // 14
                        /*
                         Un switch dans un switch. Pas forcément très esthétique, mais ça marche bien.
                         Ici, si le mot clé "affich" est suivi du mot "tous", "actif" ou "compléter",
                         on applique le filtre correspondant.

                         Nous aurions dû procéder comme pour les commandes de base et tronquer les mots ("tou",
                         "acti", et "complét"), mais nous n'en avons plus la force.
                         */
                        case "affich":
                            console.log("Affichance en cours");
                            switch (userSentence) {
                                case "tout" :
                                    sThis.filterCurrent = sThis.filterAll;
                                    break;
                                case "actif" :
                                    sThis.filterCurrent = sThis.filterActives;
                                    break;
                                case "compléter" :
                                    sThis.filterCurrent = sThis.filterCompleted;
                                    break;
                            }
                            break;
                        /*
                         "Ajouter" a été, une fois le problème de scope résolu, la commande la plus simple à
                         mettre en place : il a suffit d'appeler la méthode Ajouter(string) du noyau fonctionnel.
                         */
                        case "ajout":
                            console.log("On va ajouter un élément à la liste");
                            sNf.Ajouter(userSentence);

                            break;
                        /*
                        Nous n'avons pas trouver mieux comme nom de commande qu'"Annuler" pour retirer la dernière chose
                        de la liste. Ici aussi nous avons simplement utilisé une méthode du noyau fonctionnel (Retirer).
                         */
                        case "annul":
                            console.log("Supression du dernier élément ajouté...");
                            sNf.Retirer(sChoses[sChoses.length-1]);
                            break;
                        /*
                        Pour cocher une case donnée, on vérifie dans un premier temps que la userSentence n'est pas
                        "tou" (15). Si c'est bien le cas, on recherche le mot correspondant dans le tableau de choses,
                        et on passe son booléen à true. Sinon, si la userSentence est "tout", on passe tous les autres
                        éléments à true en appelant la méthode ToutCocherOuDecocher() (16).
                         */
                        case "coch":
                            console.log("Cochance en cours");
                            if(userSentence !== options[options.length-1]) { // 15
                                sChoses.find(v => v.texte === userSentence && !v.fait).Fait(true);
                            } else {
                                if(!(sThis.ToutEstFait())) {
                                    sThis.ToutCocherOuDecocher(); // 16
                                }
                            }
                            break;
                        /*
                        La commande "décocher" fait strictement l'opposé de cocher.
                         */
                        case "décoch":
                            console.log("Décochance en cours");
                            if(userSentence !== options[options.length-1]) {
                                sChoses.find(v => v.texte === userSentence && v.fait).Fait(false);
                            } else {
                                if(sThis.ToutEstFait()) {
                                    sThis.ToutCocherOuDecocher();
                                }
                            }
                            break;
                        /*
                        La commande lire invoque la méthode textToSpeech de ListeChoses.ts (voir plus bas).
                         */
                        case "lire":
                            sThis.textToSpeech();
                            break;
                        /*
                        La commande "supprimer" permet de supprimer un mot en particulier si elle est suivie d'un mot
                        donné (17) : pour ce faire, on trouve le mot dans le taleau de chose pour le retirer (18).
                        À noter qu'une seule occurence du mot est supprimée : s'il y a plusieurs fois la même tâche,
                        une seul d'entre elles sera effacée.
                        Sinon, si on ne précise pas de tâche après la commande, elle supprimera tous les éléments
                        cochés (19).
                         */
                        case "supprim":
                            if(userSentence !== "") { // 17
                                console.log("On va effacer un l'élément " + userSentence + " de la liste");
                                sNf.Retirer(sChoses.find(v => v.texte === userSentence)); // 18
                            } else {
                                sThis.SupprimerCochees(); // 19
                            }
                            break;
                        /*
                        Enfin, la commande vider vide entièrement la lsite. Pour ce faire, on coche tous les éléments
                        (20 et 21), puis on supprime tout ce qui est coché (22).
                         */
                        case "vid":
                            console.log("Supression de la liste...");
                            if(!(sThis.ToutEstFait())) { // 20
                                sThis.ToutCocherOuDecocher(); // 21
                            }
                            sThis.SupprimerCochees(); // 22
                            break;
                    }
                }
                /*
                Une fois la commande exécuté, #newTodo est vidé (23), et perd le focus (24).
                 */
                sThis.newTextInput.nativeElement.value = ""; // 23
                sThis.newTextInput.nativeElement.blur(); // 24
                requestAnimationFrame(() => {
                    sThis.newTextInput.nativeElement.blur();
                });
            };
            /*
            Et ça, on ne sait pas trop pourquoi c'est à la fin. Mais ça marche bien.
             */
            recognition.start();
        }
    };

    /*
    textToSpeech() se déclenche ici avec un clique sur le bouton "Synthèse vocale" au bas de la page.
    Cette méthode va lire l'intégralité de la liste qui est affichée. C'est-à-dire que selon le filtre appliqué,
    la lecture sera plus ou moins longue.

    Dans un premier temps, on fait lire le titre de la liste (25 et 26), puis selon chaque filtre, on fait un
    forEach sur tous les éléments (28, 29, 30), et selon si les choses sont cochées ou non (31, 32),
    on les fait lire (33, 34, 35, 36, 37, 38).
     */
    textToSpeech() {
        let msg = new SpeechSynthesisUtterance(this.titre + " est composée de"); // 25
        window.speechSynthesis.speak(msg); // 26
        if(this.filterCurrent === this.filterAll) {
            this.choses.forEach(function (chose) { // 28
                let msg = new SpeechSynthesisUtterance(chose.texte); // 33
                window.speechSynthesis.speak(msg); // 34
            });
        } else if(this.filterCurrent === this.filterActives) {
            this.choses.forEach(function (chose) { // 29
                if(!chose.fait) { // 31
                    let msg = new SpeechSynthesisUtterance(chose.texte); // 35
                    window.speechSynthesis.speak(msg); // 36
                }
            });
        } else if(this.filterCurrent === this.filterCompleted) {
            this.choses.forEach(function (chose) { // 30
                if(chose.fait) { // 32
                    let msg = new SpeechSynthesisUtterance(chose.texte); // 37
                    window.speechSynthesis.speak(msg); // 38
                }
            });
            }
        }

    filterAll: filterChose = (c) => true;
    filterActives: filterChose = (c) => !c.fait;
    filterCompleted: filterChose = (c) => c.fait;

}
