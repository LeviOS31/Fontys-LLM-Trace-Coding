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
            agent {
                docker { image 'node:20' }
            }
            steps {
                sh 'npm install'
                sh 'npm run build'
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