// DECLARATION DES VARIABLES
var criminologie_geojson = new ol.format.GeoJSON(), source_couche_crime = new ol.source.Vector();
var json, coords, coucheCrime, execFonc = false, gid;
// /DECLARATION DES VARIABLES

// INTERACTION GRAPHIQUE POUR LE MENU DROIT
interactionGraphiqueMenuDeNavigation(4, "criminologie", "Boîte à outils criminologie", 43, 0);
// /INTERACTION GRAPHIQUE POUR LE MENU DROIT

// LE STYLE CSS DU CONTENU HTML DU MENU DROIT
if(!$('head').find('link[href="modules/criminologie/criminologie.css"][rel="stylesheet"]').length){
    $("<link>").attr("rel", "stylesheet").attr("type", "text/css").attr("href", "modules/criminologie/criminologie.css").appendTo("head");
}
// /LE STYLE CSS DU CONTENU HTML DU MENU DROIT

// LE CONTENU HTML DU MENU DROIT
$.get("modules/criminologie/criminologie.html", function (data) {
    $("#style_selector div:eq(1)").after().append(data);
});
// /LE CONTENU HTML DU MENU DROIT

// CACHER TOUS LES POP-UPS
popup.hide();
// CACHER TOUS LES POP-UPS

// AFFICHAGE DE LA COUCHE CRIME
actualiserCoucheCriminologie();
// /AFFICHAGE DE LA COUCHE CRIME

// SUPPRESSION DE TOUTES LES AUTRES COUCHES SAUF LA COUCHE PASSÉE EN PARAMÈTRE
supprimerCouches(coucheCrime);
// /SUPPRESSION DE TOUTES LES AUTRES COUCHES SAUF LA COUCHE PASSÉE EN PARAMÈTRE

// GESTION DE CLIQUE SUR UNE LIGNE DE LA TABLE ATTRIBUTAIRE DES CRIMES
cliqueLigneTableAttr(coucheCrime, "Crime");
// /GESTION DE CLIQUE SUR UNE LIGNE DE LA TABLE ATTRIBUTAIRE DES CRIMES

// PARTIE MODIFICATION OU BIEN LE DÉPLACEMENT
function singleclick (evt) {
    features = [];
    var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        layer = [coucheCrime];
        return feature;
    });
    if (feature) {

        $("#modifierCrimeBouton").prop("disabled", false);
        
        $("#pointerCrimeModifier").hide();
        $("#pointerCrimeModifierNouvEmplace").show();
        
        $("#modifierCrime #type").next().addClass("active");
        $("#modifierCrime #description").next().addClass("active");
        $("#modifierCrime #heurem").next().addClass("active");
        $("#modifierCrime #datem").next().addClass("active");

       
        $("#modifierCrime #type").val(feature.get("type"));
        $("#modifierCrime #gravite").val(feature.get("gravite") == 'f' ? "false" : (feature.get("gravite") == 't' ? "true" : "null"));
        $("#modifierCrime #description").val(feature.get("description"));
        $("#modifierCrime #heurem").val(feature.get("dateheure").split(" ")[1]);
        $("#modifierCrime #datem").val(feature.get("dateheure").split(" ")[0]);
        gid = feature.get("gid");
    }

};

function onClique(evt){
    coords = ol.proj.toLonLat(evt.coordinate);
    $("#pointerCrimeModifierNouvEmplace").html('<i class="clip-plus-circle"></i> ' + coords[0].toFixed(6) + ", " + coords[1].toFixed(6));
}

$(document).on("click", "#reinitModifCrime", function() {
    $("#modifierCrime")[0].reset();
    $("#modifierCrimeBouton").prop("disabled", true);
    coords = null;

    if ($("#pointerCrimeModifierNouvEmplace").is(":visible") && $("#pointerCrimeModifierNouvEmplace").text().indexOf("l") >= 0 ) {
        map.un("pointermove", activerPointeurSurFeatures);
        map.un("singleclick", singleclick);
        $("#pointerCrimeModifierNouvEmplace").hide();
        $("#pointerCrimeModifier").show();

    }else{
        map.un("pointermove", activerPointeurSurFeatures);
        map.un("singleclick", singleclick);
        map.un("click", onClique);
        $("#pointerCrimeModifierNouvEmplace").html("<i class='clip-plus-circle'></i> Localisez le nouveau emplacement du crime");
        $("#pointerCrimeModifierNouvEmplace").hide();
        $("#pointerCrimeModifier").show();
    }
});

$(document).on("click", "#pointerCrimeModifier", function (evt) {
    if ($("#collapseThree").attr("class") == "panel-collapse collapse in") {
        map.on("pointermove", activerPointeurSurFeatures);
    }
    map.on("singleclick", singleclick);

});

$(document).on("click", "#pointerCrimeModifierNouvEmplace", function (evt) {
    map.un("singleclick", singleclick);
    map.un("pointermove", activerPointeurSurFeatures);
    map.on("click", onClique);
});

$(document).on("click", "#modifierCrimeBouton", function (e){
    e.preventDefault();
    data = {
        modification: true,
        
        type: $("#modifierCrime #type").val()? $("#modifierCrime #type").val(): "null",
        gravite: $("#modifierCrime #gravite").val(),
        desc: $("#modifierCrime #description").val()? "'"+$("#modifierCrime #description").val()+"'": "null",
        dateHeure: $("#datem").val() + " " + $("#heurem").val(),
        emplacement: coords,
        gid: gid
    }
    beforeSend = function(xhr){
        if(!$("#datem").val()){
            xhr.abort();
            afficherNotif("warning", "Veuillez saisir la date du crime");
        }if(!$("#heurem").val()){
            xhr.abort();
            afficherNotif("warning", "Veuillez saisir l'heure du crime");
        }
    }
    error_fatale = function (jqXhr) {
        rapportErreurs(jqXhr);
        afficherNotif("erreur_fatale", "Une erreur est survenu lors de la modification ou bien le déplacement du crime");
    }
    success = function (resultat) {
        if (resultat.type == "succes") {
            afficherNotif("succes", resultat.msg);
            actualiserCoucheCriminologie();
        
        }
    }
    ajax("modules/criminologie/criminologie.php", data, error_fatale, success, undefined, beforeSend);
});
// /PARTIE MODIFICATION OU BIEN LE DÉPLACEMENT

// PARTIE AJOUT
$(document).on("click", "#pointerCrimeAjouter", function () {
    changerPointeurAjout();
    map.on('click', function (evt) {
        coords = ol.proj.toLonLat(evt.coordinate);
        $("#pointerCrimeAjouter").html('<i class="clip-plus-circle"></i> ' + coords[0].toFixed(6) + ", " + coords[1].toFixed(6));
    });

});

$(document).on("click", "#ajouterCrimeBouton", function (e) {
    e.preventDefault();
    data = {
        ajout: true,
        
        type: $("#type").val()? $("#type").val(): "null",
        gravite: $("#gravite").val(),
        desc: $("#description").val()? "'"+$("#description").val()+"'": "null",
        dateHeure: $("#date").val() + " " + $("#heure").val(),
        emplacement: coords,
    }
    beforeSend = function(xhr){
        if(!coords){
            xhr.abort();
            afficherNotif("warning", "Veuillez localiser l'emplacement du crime");
        }if(!$("#date").val()){
            xhr.abort();
            afficherNotif("warning", "Veuillez saisir la date du crime");
        }if(!$("#heure").val()){
            xhr.abort();
            afficherNotif("warning", "Veuillez saisir l'heure du crime");
        }
    }
    error_fatale = function (jqXhr) {
        rapportErreurs(jqXhr);
        afficherNotif("erreur_fatale", "Une erreur est survenu lors de l'ajout du crime");
    }
    success = function (resultat) {
        if (resultat.type == "succes") {
            afficherNotif("succes", resultat.msg);
            actualiserCoucheCriminologie();
      
        }
    }
    ajax("modules/criminologie/criminologie.php", data, error_fatale, success, undefined, beforeSend);

});

$(document).on("click", "#reinitAjoutCrime", function(e) {
    $("#pointerCrimeAjouter").html("<i class='clip-plus-circle'></i> Localisez l'emplacement du crime");
    coords = null;
});
// /PARTIE AJOUT


// PARTIE IMPORTAION
$(document).on("change", "#fichierExcel", function () {

    function exporterExcelVersJSON() {
        var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xlsx|.xls)$/;
        /*Checks whether the file is a valid excel file*/
        if (regex.test($("#fichierExcel").val().toLowerCase())) {
            var xlsxflag = false; /*Flag for checking whether excel is .xls format or .xlsx format*/
            if ($("#fichierExcel").val().toLowerCase().indexOf(".xlsx") > 0) {
                xlsxflag = true;
            }
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = e.target.result;
                /*Converts the excel data in to object*/
                if (xlsxflag) {
                    var workbook = XLSX.read(data, { type: 'binary' });
                }
                else {
                    var workbook = XLS.read(data, { type: 'binary' });
                }
                /*Gets all the sheetnames of excel in to a variable*/
                var sheet_name_list = workbook.SheetNames;

                var cnt = 0; /*This is used for restricting the script to consider only first sheet of excel*/
                sheet_name_list.forEach(function (y) { /*Iterate through all sheets*/
                    /*Convert the cell value to Json*/
                    if (xlsxflag) {
                        exceljson = XLSX.utils.sheet_to_json(workbook.Sheets[y]);
                    }
                    else {
                        exceljson = XLS.utils.sheet_to_row_object_array(workbook.Sheets[y]);
                    }
                    if (exceljson.length > 0 && cnt == 0) {
                        getJSON(exceljson);
                    }
                });
            }
            if (xlsxflag) {/*If excel file is .xlsx extension than creates a Array Buffer from excel*/
                reader.readAsArrayBuffer($("#fichierExcel")[0].files[0]);
            }
            else {
                reader.readAsBinaryString($("#fichierExcel")[0].files[0]);
            }

        }
        else {
            afficherNotif("warning", "Veuillez ajouter un fichier Excel valide");
        }
    }

    exporterExcelVersJSON();

    function getJSON(exceljson) {
        json = exceljson;

        // L'APPEL AJAX AVEC LES PARAMÈTRES
        data = {
            importation: true,
            noms_cols_excel: Object.keys(json[0]),
            lignes_excel: json
        }
        error_fatale = function (jqXhr) {
            rapportErreurs(jqXhr);
            afficherNotif("erreur_fatale", "Une erreur est survenu lors de l'importation des crimes");
        }
        success = function (resultat) {
            if (resultat.type == "erreur") {
                afficherNotif("erreur", resultat.msg);
            }
            else if (resultat.type == "succes") {
                afficherNotif("succes", resultat.msg);
                actualiserCoucheCriminologie();
           
            }
        }

        ajax("modules/criminologie/criminologie.php", data, error_fatale, success);
        // /L'APPEL AJAX AVEC LES PARAMÈTRES
    }

});
// /PARTIE IMPORTAION

// PARTIE SUPPRESSION
function singleclick2 (evt) {
    var feature = map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
        layer = [coucheCrime];
        return feature;
    });
    if (feature) {
        $("#supprimerCrimeBouton").prop("disabled", false);
        $("#pointerCrimeSupprimer").html('<i class="clip-plus-circle"></i> Crime N° ' + feature.get("gid"));
        gid = feature.get("gid");
    }
};

$(document).on("click", "#reinitSuppCrime", function(e) {
    $("#pointerCrimeSupprimer").html("<i class='clip-plus-circle'></i> Localiser l'emplacement du crime");
    $("#supprimerCrimeBouton").prop("disabled", true);
    map.un("pointermove", activerPointeurSurFeatures);
    map.un("singleclick", singleclick2);
});

$(document).on("click", "#pointerCrimeSupprimer", function (e) {
    if ($("#collapseFour").attr("class") == "panel-collapse collapse in") {
        map.on("pointermove", activerPointeurSurFeatures);
    }
    map.on("singleclick", singleclick2);

});

$(document).on("click", "#supprimerCrimeBouton", function (e) {
    e.preventDefault();
    data = {
        suppression: true,
        gid: gid,
    }
    error_fatale = function (jqXhr) {
        rapportErreurs(jqXhr);
        afficherNotif("erreur_fatale", "Une erreur est survenu lors de la suppression du crime");
    }
    success = function (resultat) {
        if (resultat.type == "succes") {
            afficherNotif("succes", resultat.msg);
            actualiserCoucheCriminologie();
           
        }
    }
    ajax("modules/criminologie/criminologie.php", data, error_fatale, success);

});
// /PARTIE SUPPRESSION

// PARTIE HISTORIQUE
$(document).on("click", "#historiqueCrimeBouton", function (e) {
    
    // REMPLISSAGE DE LA TABLE D'HISTORIQUE
    remplirTableHistorique("crime", "modules/criminologie/criminologie.php");
    // /REMPLISSAGE DE LA TABLE D'HISTORIQUE

});
// /PARTIE HISTORIQUE

// PARTIE STATISTIQUES
$(document).on("click", "#statistiquesCrimeBouton", function (e) {
    $("#statistiquesTitre").text("les statistiques des crimes");
});
// /PARTIE STATISTIQUES


// FONCTION D'ACTUALISATION DE LA COUCHE CRIME
function actualiserCoucheCriminologie() {

    // DÉFINITION DU STYLE DE LA COUCHE CRIME
    var styleCoucheCrime = function (feature) {

        var src = 'assets/img/crime.png';
        var style_crime = {
            'Point':
                new ol.style.Style({
                    image: new ol.style.Icon({
                        anchor: [0.5, 0.5],
                        anchorXUnits: 'fraction',
                        anchorYUnits: 'fraction',
                        src: src
                    })
                })
        };
        return style_crime[feature.getGeometry().getType()];
    }
    // /DÉFINITION DU STYLE DE LA COUCHE CRIME

    // DÉFINITION DE LA COUCHE CRIME
    coucheCrime = new ol.layer.Vector({
        name: 'CoucheCrime',
        title: 'Couche Crime',
        visible: true,
        source: source_couche_crime,
        style: styleCoucheCrime
    });
    // /DÉFINITION DE LA COUCHE CRIME

    // SUPPRESSION DU CONTENU DE LA COUCHE CRIME 
    source_couche_crime.clear();
    // /SUPPRESSION DU CONTENU DE LA COUCHE CRIME

    // L'APPEL AJAX AVEC LES PARAMÈTRES
    data = {
        selection: true
    }
    success = function (result) {
        var features = criminologie_geojson.readFeatures(result, { featureProjection: 'EPSG:3857' });
        source_couche_crime.addFeatures(features);
        afficherNotif("info", "La couche des crimes  a été bien actualisée");

        // CALCULE DE CENTROÏDE
        pulse(calculerCentroide(coucheCrime));
        // /CALCULE DE CENTROÏDE
    }
    error_fatale = function (jqXhr) {
        rapportErreurs(jqXhr);
        afficherNotif("erreur_fatale", "Une erreur est survenu lors du chargement de la couche des crimes");
    }
    ajax("modules/criminologie/criminologie.php", data, error_fatale, success);
    // /L'APPEL AJAX AVEC LES PARAMÈTRES

    // L'AJOUT DE LA COUCHE CRIME À LA CARTE
    map.addLayer(coucheCrime);
    // /L'AJOUT DE LA COUCHE CRIME À LA CARTE

}
// /FONCTION D'ACTUALISATION DE LA COUCHE CRIME

// REMPLIR LA TABLE ATTRIBUTAIRE DE LA TABLE CRIME
remplirTableAttributaire("crime", "modules/criminologie/criminologie.php");
// /REMPLIR LA TABLE ATTRIBUTAIRE DE LA TABLE CRIME