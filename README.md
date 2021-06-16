# Greeno Web App

Questa applicazione web consente di visualizzare i dati raccolti dai sensori del progetto Greeno.

## Requisiti

* Webserver Apache 2.4+
* PHP 5.4.x - 7.4.x
* Compatibilità con IE11+ e tutti i browser moderni 

## Installazione

Prima della messa in funzione è necessario modificare alcuni file di configurazione.

* Nel file `inc/constants.php` cambiare il valore della costante `DATA_PATH` per specificare il percorso della directory che contiene i dati raccolti.
* Nel file opzionale`config/nodes.php` è possibile indicare alcuni metadati relativi ai nodi quali indirizzo di rete, etichetta, posizione, altezza dal suolo, area di appartenenza, e tipo di hardware. Vedi gli esempi per maggiori dettagli.
* Nel file opzionale`config/page.php` è possibile specificare il titolo della pagina, descrizione, etichette etichette, tooltips nome delle tracce, unità di misura. Consultare gli esempi per maggiori dettagli.