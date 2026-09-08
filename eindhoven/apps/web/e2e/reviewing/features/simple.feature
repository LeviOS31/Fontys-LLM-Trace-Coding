Feature: Trace reviewing and evaluation
  As a reviewer, I want to easily and without friction review a "trace" so that I can quickly and effectively evaluate it.

  Scenario Outline: Positive review
    Given I have read the trace
    When I give a positive review by clicking the thumbs up button
    Then My review is saved
    And I see a message "Trace saved"
    And I am directed to the next trace in the list

  Scenario Outline: Negative review
    Given I have read the trace
    When I give a negative review by clicking the thumbs down button
    Then Will the open code input field be displayed

  Scenario Outline: Open code input
    Given I have given a negative review
    When I have filled in the open code field
    And I click the submit button
    Then The review is saved
    And I see a message "Trace saved"
    And I am directed to the next trace in the list