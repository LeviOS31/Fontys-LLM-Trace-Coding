Feature: Projecten aanmaken
  Als onderzoeker
  Wil ik een nieuw project aanmaken
  Zodat ik mijn traces kan organiseren

  Background:
    Given ik ben op de projectenpagina

  Scenario: Succesvol aanmaken van een project
    When ik klik op "Nieuw project"
    And ik vul "Naam" in met "Project 1"
    And ik vul "Beschrijving" in met "Project 1 beschrijving"
    And ik klik op "Project aanmaken"
    Then zie ik een succesmelding "Project aangemaakt"
    And zie ik het project "Project 1" in de projectenlijst

  Scenario: Project aanmaken met een al bestaande naam
    Given er bestaat al een project met naam "Project 1"
    When ik klik op "Nieuw project"
    And ik vul "Naam" in met "Project 1"
    And ik klik op "Project aanmaken"
    Then zie ik een foutmelding "Projectnaam bestaat al"
    And is het project niet dubbel aangemaakt
