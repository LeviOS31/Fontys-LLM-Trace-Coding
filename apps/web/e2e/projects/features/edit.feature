Feature: Projecten bewerken
  Als onderzoeker
  Wil ik een bestaand project kunnen aanpassen
  Zodat ik de projectgegevens actueel kan houden

  Background:
    Given ik ben op de projectenpagina

  Scenario: Succesvol bewerken van een project naam en beschrijving
    Given er bestaat al een project met naam "Project Origineel"
    When ik open het menu van project "Project Origineel"
    And ik klik op "Bewerken"
    And ik vul "Naam" in met "Project Bijgewerkt"
    And ik klik op "Opslaan"
    Then zie ik het project "Project Bijgewerkt" in de projectenlijst
    And zie ik het project "Project Origineel" niet meer in de projectenlijst

  Scenario: Project bewerken naar een al bestaande naam
    Given er bestaat al een project met naam "Project A"
    And er bestaat al een project met naam "Project B"
    When ik open het menu van project "Project B"
    And ik klik op "Bewerken"
    And ik vul "Naam" in met "Project A"
    And ik klik op "Opslaan"
    Then zie ik een foutmelding "Projectnaam bestaat al"
