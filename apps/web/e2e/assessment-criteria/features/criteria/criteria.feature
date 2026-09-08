Feature: Beoordelingscriteria beheren per project
  Als gebruiker wil ik per project beoordelingscriteria kunnen aangeven, zodat beoordelaars duidelijke richtlijnen hebben tijdens het beoordelingsproces.

  Scenario: display current assessment criteria
    When a project has been selected
    And the user selects the "assessment criteria" button
    Then display the current assessment criteria alongside an edit button.

  Scenario: edit and save criteria
    When a project has been selected
    And the edit button has been selected
    And the user has entered assessment criteria
    And the user saves the criteria
    Then the criteria are stored and linked to that project.
    And the criteria remain updated when the page reloads

  Scenario: edit previously saved criteria
    When a project has been selected
    And assessment criteria have previously been saved
    And the user edits and saves the criteria
    Then the updated criteria are stored and linked to that project.
    And the criteria remain updated when the page reloads

  Scenario: failed save
    When a project has been selected
    And the user saves assessment criteria
    And the save request fails
    Then display an error indicating the criteria could not be saved, including the reason why it failed.
