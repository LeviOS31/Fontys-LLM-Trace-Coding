pipeline {
    agent any

    environment {
        APP_ENV = 'staging'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'echo "Building..."'
                // e.g. sh 'mvn clean package' or sh 'npm install && npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'echo "Running tests..."'
                // e.g. sh 'mvn test' or sh 'npm test'
            }
        }

        stage('Deploy') {
            steps {
                sh 'echo "Deploying to staging..."'
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}