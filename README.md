# Greeno Web App

Questa applicazione web consente di visualizzare i dati raccolti dai sensori del progetto Greeno.

## Installazione

Prima della messa in funzione è necessario modificare alcuni file di configurazione.

 1. Nel file `inc/constants.php` cambiare il valore della costante `DATA_PATH` per specificare il percorso della directory che contiene i dati raccolti.
 2. Nel file opzionale`config/nodes.php` è possibile indicare alcuni metadati relativi ai nodi come indirizzo di rete, etichetta, posizione, altezza dal suolo, area di appartenenza, e tipo di hardware. Vedi gli esempi per maggiori dettagli.
 3.  Nel file opzionale`config/page.php` è possibile specificare il titolo della pagina, descrizione, etichette etichette, tooltips nome delle tracce, unità di misura. Consultare gli esempi per maggiori dettagli.