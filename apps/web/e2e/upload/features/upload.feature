Feature: File uploading and parsing
  As a researcher/reviewer, I want to easily and quickly upload and "parse" a file for evaluation. I need the ability to upload file(s) and select the file types (e.g., JSON, CSV, or OpenTelemetry) so the system can process them correctly.

  Scenario Outline: Uploading a correct file
    Given I am on the upload page for a specific project and tracelist
    When I upload a correct file via the button
    And I manually select the correct file type
    Then I see the file in the file list
    When I submit the file for processing
    Then I see the result of the processing

  Scenario Outline: Uploading incorrect files
    Given I am on the upload page for a specific project and tracelist
    When I upload an incorrect file via the button
    Then The file type is automatically selected
    And I see the file in the file list
    When I submit the file for processing
    Then I see a clear error message about what went wrong during processing
    And I get the opportunity to refill the form

  Scenario Outline: Status during processing
    Given I am on the upload page for a specific project and tracelist
    When I upload a correct file via the button
    And I submit the file for processing
    Then I must see visual feedback or an indicator that the system is busy