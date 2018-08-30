<?php

// INCLURE DES FONCTIONS UTILES PHP-POSTGRES
require_once "../../assets/php/fonctions.php";
// /INCLURE DES FONCTIONS UTILES PHP-POSTGRES

// LE CAS D'AJOUT
if($_POST["ajout"]){
    $var = executerRequete("INSERT INTO crime VALUES (DEFAULT, ".$_POST['type'].", ".$_POST['gravite'].", ".$_POST['desc'].", to_timestamp('".$_POST['dateHeure']."', 'dd/mm/yyyy hh24:mi'), st_geomfromtext('POINT(".$_POST['emplacement'][0]." ".$_POST['emplacement'][1].")', 4326) )");
    if($var){
    echo json_encode(array(
        "type" => "succes",
        "msg" => "Le crime a été bien ajouté avec succès"
        ));
    }
}
// /LE CAS D'AJOUT

// LE CAS DE LA MODIFICATION OU BIEN LE DÉPLACEMENT
if($_POST['modification']){
    if($_POST['emplacement']){
        $var = executerRequete("UPDATE crime SET type = ".$_POST['type'].", gravite = ".$_POST['gravite'].", description = ".$_POST['desc'].", dateheure = to_timestamp('".$_POST['dateHeure']."', 'dd/mm/yyyy hh24:mi'), emplacement = st_geomfromtext('POINT(".$_POST['emplacement'][0]." ".$_POST['emplacement'][1].")', 4326) WHERE gid = ".$_POST['gid']."");
    }else{
        $var = executerRequete("UPDATE crime SET type = ".$_POST['type'].", gravite = ".$_POST['gravite'].", description = ".$_POST['desc'].", dateheure = to_timestamp('".$_POST['dateHeure']."', 'dd/mm/yyyy hh24:mi') WHERE gid = ".$_POST['gid']."");
    }

    if($var){
    echo json_encode(array(
        "type" => "succes",
        "msg" => "Le crime a été bien modifié / déplacé avec succès"
        ));
    }
}
// LE CAS DE LA MODIFICATION OU BIEN LE DÉPLACEMENT

// LE CAS D'IMPORTATION DU FICHIER EXCEL VERS LA TABLE CRIME
if($_POST["importation"]){
    // RÉCUPÉRATION DES NOMS DE COLONNES DE LA TABLE
    $noms_cols_crime = colsTabVersArray("crime");
    // /RÉCUPÉRATION DES NOMS DE COLONNES DE LA TABLE

    // SUPPRESSION DE LA COLONNE GID
    array_shift($noms_cols_crime);
    // /SUPPRESSION DE LA COLONNE GID
    
    // COMPARAISON ENTRE LES NOMS DE COLONNES DE LA TABEL ET LES NOMS DE COLONNES DE FICHIER EXCEL
    $n = count(array_udiff($noms_cols_crime, $_POST['noms_cols_excel'], "strcasecmp"));
    // /COMPARAISON ENTRE LES NOMS DE COLONNES DE LA TABEL ET LES NOMS DE COLONNES DE FICHIER EXCEL
    if (!$n){

        $transaction = "BEGIN;";
        // INSERTION DANS LA TABLE
        for($i=0; $i<count($_POST["lignes_excel"]); $i++){
            $gravite = $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][1]]=="grave"? "null": (strpos($_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][1]], "plus") === false? "false": "true");
            $desc = $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][2]]? "'".$_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][2]]."'": "null";
            
            switch ($_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]]) {
                case "Violence familiale":
                    $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]]=0;
                    break;
                case "Agression sexuelle":
                    $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]]=1;
                    break;
                case "Harcèlement criminel":
                    $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]]=2;
                    break;
                case "Violence et menaces physiques":
                    $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]]=3;
                    break;
                case "Vol et autres crimes contre les biens":
                    $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]]=4;
                    break;
                case "Autres":
                    $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]]=5;
                    break;
            }
            $transaction .= "INSERT INTO crime ( ".$_POST['noms_cols_excel'][0].", ".$_POST['noms_cols_excel'][1].", ".$_POST['noms_cols_excel'][2].", ".$_POST['noms_cols_excel'][3].", ".$_POST['noms_cols_excel'][4]." ) VALUES (".$_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][0]].", $gravite, $desc, to_timestamp('".$_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][3]]."', 'dd/mm/yyyy hh24:mi'),   st_geomfromtext('POINT(".explode(',', $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][4]])[0]." ".explode(',', $_POST['lignes_excel'][$i][$_POST['noms_cols_excel'][4]])[1].")', 4326)  );";
            
        }

        executerRequete($transaction .= "COMMIT;");
        
        echo json_encode(array(
            "type" => "succes",
            "msg" => $in." ".count($_POST["lignes_excel"])." les crimes ont été importés avec succès"
        ));
        
    }
    // CAS D'ERREUR DE SYNTAXE DES NOMS COLONNES
    else{

        if($n==1){
            echo json_encode(array(
                "type" => "erreur",
                "msg" => "Le nom de la colonne suivante dans le fichier Excel [ ".implode(array_udiff($_POST['noms_cols_excel'], $noms_cols_crime, "strcasecmp"))." ] ne respecte pas la même syntaxe dans la base de données [ ".implode(array_udiff($noms_cols_crime, $_POST['noms_cols_excel'], "strcasecmp"))." ]"
            ));
        }
        else{
            echo json_encode(array(
                "type" => "erreur",
                "msg" => "Les noms des colonnes suivantes dans le fichier Excel [ ".implode(', ', array_udiff($_POST['noms_cols_excel'], $noms_cols_crime, "strcasecmp"))." ] ne respectent pas la même syntaxe dans la base de données [ ".implode(', ', array_udiff($noms_cols_crime, $_POST['noms_cols_excel'], "strcasecmp"))." ]"
            ));
        }
        
    }
    // /CAS D'ERREUR DE SYNTAXE DES NOMS COLONNES

}
// /LE CAS D'IMPORTATION DU FICHIER EXCEL VERS LA TABLE CRIME

// LE CAS SELECTION
if($_POST['selection']){
    $feature = array();
    $result = executerRequete("SELECT gid, type, gravite, description, to_char(dateheure, 'DD/MM/YYYY HH24:MI') AS dateheure, st_asgeojson(emplacement) AS geom FROM crime");
        if($result) {
		    while($row = pg_fetch_assoc($result)) {
		    	$row['removable']='true';
			    $type = '"type": "Feature"';
	            $geometry = '"geometry": '.$row['geom'];
	            unset($row['geom']);
	            $properties = '"properties": '.json_encode($row);
	            $feature[] = '{'.$type.', '.$geometry.', '.$properties.'}';
				
            }
            $header = '{"type": "FeatureCollection", "features": [';
            $footer = ']}';
		    if(count($feature) > 0) {
			    echo $header.implode(', ', $feature).$footer;
		    }
		    else {
			    echo '{"type":"FeatureCollection", "features":"empty"}';
		    }
        }
}
// /LE CAS SELECTION

// LE CAS SUPPRESSION
if($_POST["suppression"]){
    $var = executerRequete("DELETE FROM crime WHERE gid = ".$_POST['gid']."");
    if($var){
    echo json_encode(array(
        "type" => "succes",
        "msg" => "Le crime a été supprimé avec succès"
        ));
    }
}
// LE CAS SUPPRESSION

// LE CAS DE LA TABLE ATTRIBUTAIRE
if($_POST['tableAttributaire']){

    $colonnes = array();
    $noms_cols = array("Id", "Type", "Gravité", "Description", "Date et heure");
    $donnees = array();

    for($i = 0; $i < count(colsTabVersArray("crime"))-1; $i++){
        array_push($colonnes, array(
            "data" => colsTabVersArray("crime")[$i],
            "name" => mb_strtoupper($noms_cols[$i])
            )
        );
    }

    $req = executerRequete("SELECT gid , CASE WHEN type=0 THEN 'Violence familiale' WHEN type = 1 THEN 'Agression sexuelle' WHEN type = 2 THEN 'Harcèlement criminel' WHEN type =3 then 'Violence et menaces physiques' WHEN type=4 THEN 'Vol et autres crimes contre les biens' WHEN type =5 THEN 'Autres'  END AS type, CASE WHEN gravite THEN 'Plus grave' WHEN gravite = false THEN 'Moins grave' WHEN gravite IS NULL THEN 'Grave' END AS gravite, COALESCE(description, 'Pas de description') as description, to_char(dateheure, 'DD/MM/YYYY HH24:MI') AS dateheure FROM crime");
        if($req) {
		    while($ligne = pg_fetch_assoc($req)) {
                array_push($donnees, array(
                    colsTabVersArray("crime")[0] => $ligne[colsTabVersArray("crime")[0]],
                    colsTabVersArray("crime")[1] => $ligne[colsTabVersArray("crime")[1]],
                    colsTabVersArray("crime")[2] => $ligne[colsTabVersArray("crime")[2]],
                    colsTabVersArray("crime")[3] => $ligne[colsTabVersArray("crime")[3]],
                    colsTabVersArray("crime")[4] => $ligne[colsTabVersArray("crime")[4]],
                    )
                );
            }
        }
    
    echo json_encode(array("data" => $donnees) + array("columns" => $colonnes));
}
// /LE CAS DE LA TABLE ATTRIBUTAIRE

// LE CAS DU STATISTIQUES
if($_POST['statistiques']){
    $chartZoomable = array();
    $piePourceBlesMorts = array();
    $piePourceGravite = array();
    $chartLigneBles = array();
    $chartLigneMorts = array();

    if(!$_POST["dateHeureFin"] && $_POST["dateHeureDeb"]){
        $req = executerRequete("SELECT COALESCE(type, 0) AS nbrcrimes, EXTRACT(epoch FROM dateheure)*1000 AS dateheure FROM crime WHERE dateheure >= to_timestamp('".$_POST['dateHeureDeb']."', 'DD/MM/YYYY HH24:MI') GROUP BY dateheure ORDER BY dateheure");
    
        $req3 = executerRequete("SELECT TRUNC(CAST(COUNT(CASE WHEN gravite THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS tresgrave, TRUNC(CAST(COUNT(CASE WHEN gravite IS NULL THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS grave, TRUNC(CAST(COUNT(CASE WHEN gravite=false THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS moinsgrave from crime WHERE dateheure >= to_timestamp('".$_POST['dateHeureDeb']."', 'DD/MM/YYYY HH24:MI')");
        $req4 = executerRequete("SELECT COALESCE(type, 0)) AS nbrcrimes, EXTRACT(epoch FROM dateheure)*1000 AS dateheure FROM crime WHERE dateheure >= to_timestamp('".$_POST['dateHeureDeb']."', 'DD/MM/YYYY HH24:MI') GROUP BY dateheure ORDER BY dateheure");
    }else if($_POST["dateHeureFin"] && !$_POST["dateHeureDeb"]){
        $req = executerRequete("SELECT COALESCE(type, 0) AS nbrvcrimes, EXTRACT(epoch FROM dateheure)*1000 AS dateheure FROM crime WHERE dateheure <= to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI') GROUP BY dateheure ORDER BY dateheure");
        $req2 = executerRequete("SELECT TRUNC((CAST(SUM(COALESCE(nbrmorts, 0)) AS decimal)*100)/SUM((COALESCE(nbrmorts, 0)+COALESCE(nbrblesses, 0))), 2) AS pourceMorts, TRUNC((CAST(SUM(COALESCE(nbrblesses, 0)) AS decimal)*100)/SUM((COALESCE(nbrmorts, 0)+COALESCE(nbrblesses, 0))), 2) AS pourceBlesses FROM accident WHERE dateheure <= to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI')");
        $req3 = executerRequete("SELECT TRUNC(CAST(COUNT(CASE WHEN gravite THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS tresgrave, TRUNC(CAST(COUNT(CASE WHEN gravite IS NULL THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS grave, TRUNC(CAST(COUNT(CASE WHEN gravite=false THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS moinsgrave from accident WHERE dateheure <= to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI')");
        $req4 = executerRequete("SELECT SUM(COALESCE(nbrmorts, 0)) AS nbrmorts , SUM(COALESCE(nbrblesses, 0)) AS nbrblesses, EXTRACT(epoch FROM dateheure)*1000 AS dateheure FROM accident WHERE dateheure <= to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI') GROUP BY dateheure ORDER BY dateheure");
    }else{
        $req = executerRequete("SELECT SUM (COALESCE(nbrmorts, 0)+COALESCE(nbrblesses, 0)) AS nbrvictimes, EXTRACT(epoch FROM dateheure)*1000 AS dateheure FROM accident WHERE dateheure BETWEEN to_timestamp('".$_POST['dateHeureDeb']."', 'DD/MM/YYYY HH24:MI') AND to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI') GROUP BY dateheure ORDER BY dateheure");
        $req2 = executerRequete("SELECT TRUNC((CAST(SUM(COALESCE(nbrmorts, 0)) AS decimal)*100)/SUM((COALESCE(nbrmorts, 0)+COALESCE(nbrblesses, 0))), 2) AS pourceMorts, TRUNC((CAST(SUM(COALESCE(nbrblesses, 0)) AS decimal)*100)/SUM((COALESCE(nbrmorts, 0)+COALESCE(nbrblesses, 0))), 2) AS pourceBlesses FROM accident WHERE dateheure BETWEEN to_timestamp('".$_POST['dateHeureDeb']."', 'DD/MM/YYYY HH24:MI') AND to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI')");
        $req3 = executerRequete("SELECT TRUNC(CAST(COUNT(CASE WHEN gravite THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS tresgrave, TRUNC(CAST(COUNT(CASE WHEN gravite IS NULL THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS grave, TRUNC(CAST(COUNT(CASE WHEN gravite=false THEN 0 END)*100 AS decimal)/(COUNT(CASE WHEN gravite THEN 0 END)+COUNT(CASE WHEN gravite IS NULL THEN 0 END)+COUNT(CASE WHEN gravite=false THEN 0 END)), 2) AS moinsgrave from accident WHERE dateheure BETWEEN to_timestamp('".$_POST['dateHeureDeb']."', 'DD/MM/YYYY HH24:MI') AND to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI')");
        $req4 = executerRequete("SELECT SUM(COALESCE(nbrmorts, 0)) AS nbrmorts , SUM(COALESCE(nbrblesses, 0)) AS nbrblesses, EXTRACT(epoch FROM dateheure)*1000 AS dateheure FROM accident WHERE dateheure BETWEEN to_timestamp('".$_POST['dateHeureDeb']."', 'DD/MM/YYYY HH24:MI') AND to_timestamp('".$_POST['dateHeureFin']."', 'DD/MM/YYYY HH24:MI') GROUP BY dateheure ORDER BY dateheure");
    }

    if($req) {
		while($ligne = pg_fetch_assoc($req)) {
            array_push($chartZoomable, array(
                intval($ligne["dateheure"]),
                intval($ligne["nbrvictimes"])
                )
            );
        }
    }

    if($req2){
        while($ligne = pg_fetch_assoc($req2)) {
            array_push($piePourceBlesMorts, array(
                "Morts", floatval($ligne["pourcemorts"])? floatval($ligne["pourcemorts"]): 0
                )
            );
            array_push($piePourceBlesMorts, array(
                "Blessés", floatval($ligne["pourceblesses"])? floatval($ligne["pourceblesses"]): 0
                )
            );
        }
    }

    if($req3){
        while($ligne = pg_fetch_assoc($req3)) {
            array_push($piePourceGravite, array(
                "Plus grave", floatval($ligne["tresgrave"])? floatval($ligne["tresgrave"]): 0
                )
            );
            array_push($piePourceGravite, array(
                "Grave", floatval($ligne["grave"])? floatval($ligne["grave"]): 0
                )
            );
            array_push($piePourceGravite, array(
                "Moins grave", floatval($ligne["moinsgrave"])? floatval($ligne["moinsgrave"]): 0
                )
            );
        }
    }

    if($req4) {
		while($ligne = pg_fetch_assoc($req4)) {
            array_push($chartLigneBles,
                [intval($ligne["dateheure"]), intval($ligne["nbrblesses"])]
            );
            array_push($chartLigneMorts,
                [intval($ligne["dateheure"]), intval($ligne["nbrmorts"])]
            );
        }
    }

    echo json_encode(array(
        "chartZoomable" => $chartZoomable,
        "piePourceBlesMorts" => $piePourceBlesMorts,
        "piePourceGravite" => $piePourceGravite,
        "chartLigneBlesMorts" => ["Morts" => $chartLigneMorts,
                                  "Blesses" => $chartLigneBles
        ]
    ));
}
// /LE CAS DE LA TABLE ATTRIBUTAIRE
?>