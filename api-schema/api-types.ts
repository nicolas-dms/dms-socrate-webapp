// Types générés automatiquement depuis le schéma OpenAPI
// Généré le: 2025-08-12T08:13:47.121Z
// Source: http://localhost:8000/openapi.json

export interface ApiInfo {
  title: string;
  version: string;
  description?: string;
}

export interface OpenApiSchema {
  openapi: string;
  info: ApiInfo;
  paths: Record<string, any>;
  components?: Record<string, any>;
}

// Schéma complet exporté
export const API_SCHEMA: OpenApiSchema = {
  "openapi": "3.1.0",
  "info": {
    "title": "DMSAPP Backend",
    "version": "0.1.0"
  },
  "paths": {
    "/api/auth/send-code": {
      "post": {
        "summary": "Send Code",
        "description": "Request a magic link code for authentication.\nThe code will be sent to the provided email address.",
        "operationId": "send_code_api_auth_send_code_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/SendCodeRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/SendCodeResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      "post": {
        "summary": "Login",
        "description": "Verify magic link code and return authentication token with user data.\nCreates a new user if they don't exist.",
        "operationId": "login_api_auth_login_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/LoginRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LoginResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/me": {
      "get": {
        "summary": "Get Current User Info",
        "description": "Get current authenticated user information.\nRequires valid JWT token in Authorization header.",
        "operationId": "get_current_user_info_api_auth_me_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/api/auth/logout": {
      "post": {
        "summary": "Logout User",
        "description": "Logout user by invalidating their session token.",
        "operationId": "logout_user_api_auth_logout_post",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/LogoutResponse"
                }
              }
            }
          }
        },
        "security": [
          {
            "HTTPBearer": []
          }
        ]
      }
    },
    "/api/auth/refresh": {
      "post": {
        "summary": "Refresh Token",
        "description": "Refresh JWT token using refresh token.",
        "operationId": "refresh_token_api_auth_refresh_post",
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/RefreshRequest"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/RefreshResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/health": {
      "get": {
        "summary": "Auth Health Check",
        "description": "Health check endpoint for authentication service.",
        "operationId": "auth_health_check_api_auth_health_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          }
        }
      }
    },
    "/api/health/cosmos": {
      "get": {
        "summary": "Cosmos Health Check",
        "operationId": "cosmos_health_check_api_health_cosmos_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          }
        }
      }
    },
    "/api/infra/create-databases-containers": {
      "post": {
        "summary": "Create Databases And Containers",
        "operationId": "create_databases_and_containers_api_infra_create_databases_containers_post",
        "responses": {
          "201": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          }
        }
      }
    },
    "/api/users/{user_id}": {
      "get": {
        "summary": "Get User",
        "description": "Get user by ID",
        "operationId": "get_user_api_users__user_id__get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "User ID (email)",
              "title": "User Id"
            },
            "description": "User ID (email)"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserModel"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update User",
        "description": "Update user",
        "operationId": "update_user_api_users__user_id__put",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "User ID (email)",
              "title": "User Id"
            },
            "description": "User ID (email)"
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserUpdate"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserModel"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete User",
        "description": "Delete user",
        "operationId": "delete_user_api_users__user_id__delete",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "description": "User ID (email)",
              "title": "User Id"
            },
            "description": "User ID (email)"
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/users": {
      "get": {
        "summary": "Get User By Email",
        "description": "Get user by email",
        "operationId": "get_user_by_email_api_users_get",
        "parameters": [
          {
            "name": "email",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Email"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "anyOf": [
                    {
                      "$ref": "#/components/schemas/UserModel"
                    },
                    {
                      "type": "null"
                    }
                  ],
                  "title": "Response Get User By Email Api Users Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create User",
        "description": "Create new user",
        "operationId": "create_user_api_users_post",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UserCreate"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/UserModel"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/generate/{userId}": {
      "post": {
        "summary": "Generate Exercises",
        "operationId": "generate_exercises_api_education_exercises_generate__userId__post",
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Userid"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ExerciceGenerationRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ExerciceResponse"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}": {
      "get": {
        "summary": "Get User Exercise Files",
        "description": "Get all exercise files for a specific user",
        "operationId": "get_user_exercise_files_api_education_exercises_files__user_id__get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ExerciceFile"
                  },
                  "title": "Response Get User Exercise Files Api Education Exercises Files  User Id  Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/by-level/{level}": {
      "get": {
        "summary": "Get User Exercise Files By Level",
        "description": "Get exercise files for a specific user filtered by education level",
        "operationId": "get_user_exercise_files_by_level_api_education_exercises_files__user_id__by_level__level__get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "level",
            "in": "path",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/ExerciceLevel"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ExerciceFile"
                  },
                  "title": "Response Get User Exercise Files By Level Api Education Exercises Files  User Id  By Level  Level  Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/by-domain/{domain}": {
      "get": {
        "summary": "Get User Exercise Files By Domain",
        "description": "Get exercise files for a specific user filtered by subject domain",
        "operationId": "get_user_exercise_files_by_domain_api_education_exercises_files__user_id__by_domain__domain__get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "domain",
            "in": "path",
            "required": true,
            "schema": {
              "$ref": "#/components/schemas/ExerciceDomain"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ExerciceFile"
                  },
                  "title": "Response Get User Exercise Files By Domain Api Education Exercises Files  User Id  By Domain  Domain  Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/stats": {
      "get": {
        "summary": "Get User Exercise File Statistics",
        "description": "Get statistics about a user's exercise files",
        "operationId": "get_user_exercise_file_statistics_api_education_exercises_files__user_id__stats_get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": true,
                  "title": "Response Get User Exercise File Statistics Api Education Exercises Files  User Id  Stats Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/{file_id}": {
      "get": {
        "summary": "Get Exercise File By Id",
        "description": "Get a specific exercise file by ID for a user",
        "operationId": "get_exercise_file_by_id_api_education_exercises_files__user_id___file_id__get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "file_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "File Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ExerciceFile"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/{filename}/download": {
      "get": {
        "summary": "Download Exercise File",
        "description": "Download exercise file directly with content streaming",
        "operationId": "download_exercise_file_api_education_exercises_files__user_id___filename__download_get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "filename",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Filename"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/{filename}/increment-download": {
      "put": {
        "summary": "Increment Download Count Only",
        "description": "Increment download count for an exercise file without downloading",
        "operationId": "increment_download_count_only_api_education_exercises_files__user_id___filename__increment_download_put",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "filename",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Filename"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "additionalProperties": {
                    "type": "string"
                  },
                  "title": "Response Increment Download Count Only Api Education Exercises Files  User Id   Filename  Increment Download Put"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/{file_id}/name": {
      "put": {
        "summary": "Update Exercise File Custom Name",
        "description": "Update the custom name for an exercise file",
        "operationId": "update_exercise_file_custom_name_api_education_exercises_files__user_id___file_id__name_put",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "file_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "File Id"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateCustomNameRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ExerciceFile"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/{file_id}/tags": {
      "options": {
        "summary": "Options Update Exercise File Tags",
        "description": "Handle OPTIONS preflight request for tags update",
        "operationId": "options_update_exercise_file_tags_api_education_exercises_files__user_id___file_id__tags_options",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "file_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "File Id"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      },
      "put": {
        "summary": "Update Exercise File Tags",
        "description": "Update the tags for an exercise file",
        "operationId": "update_exercise_file_tags_api_education_exercises_files__user_id___file_id__tags_put",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "file_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "File Id"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/UpdateTagsRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ExerciceFile"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/api/education/exercises/files/{user_id}/by-tags": {
      "get": {
        "summary": "Get User Exercise Files By Tags",
        "description": "Get exercise files for a specific user filtered by tags (comma-separated)",
        "operationId": "get_user_exercise_files_by_tags_api_education_exercises_files__user_id__by_tags_get",
        "parameters": [
          {
            "name": "user_id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string",
              "title": "User Id"
            }
          },
          {
            "name": "tags",
            "in": "query",
            "required": true,
            "schema": {
              "type": "string",
              "title": "Tags"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/ExerciceFile"
                  },
                  "title": "Response Get User Exercise Files By Tags Api Education Exercises Files  User Id  By Tags Get"
                }
              }
            }
          },
          "422": {
            "description": "Validation Error",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/HTTPValidationError"
                }
              }
            }
          }
        }
      }
    },
    "/": {
      "get": {
        "summary": "Root",
        "operationId": "root__get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          }
        }
      }
    },
    "/favicon.ico": {
      "get": {
        "summary": "Favicon",
        "description": "Return empty response for favicon requests to avoid 404 errors",
        "operationId": "favicon_favicon_ico_get",
        "responses": {
          "200": {
            "description": "Successful Response",
            "content": {
              "application/json": {
                "schema": {}
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "ExerciceDomain": {
        "type": "string",
        "enum": [
          "mathematiques",
          "francais"
        ],
        "title": "ExerciceDomain"
      },
      "ExerciceFile": {
        "properties": {
          "file_id": {
            "type": "string",
            "title": "File Id",
            "description": "Identifiant unique du fichier"
          },
          "parcours_id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Parcours Id",
            "description": "Identifiant du parcours auquel le fichier est associé"
          },
          "filename": {
            "type": "string",
            "title": "Filename",
            "description": "Nom du fichier"
          },
          "filepath": {
            "type": "string",
            "title": "Filepath",
            "description": "Chemin d'accès du fichier dans le stockage cloud"
          },
          "custom_name": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Custom Name",
            "description": "Nom personnalisé défini par l'utilisateur"
          },
          "tags": {
            "items": {
              "type": "string"
            },
            "type": "array",
            "title": "Tags",
            "description": "Liste des tags associés au fichier",
            "default": []
          },
          "class_level": {
            "$ref": "#/components/schemas/ExerciceLevel",
            "description": "Niveau de classe associé"
          },
          "exercice_time": {
            "$ref": "#/components/schemas/ExerciceTime",
            "description": "Temps estimé pour la feuille d'exercice"
          },
          "exercice_domain": {
            "$ref": "#/components/schemas/ExerciceDomain",
            "description": "Domaine de l'exercice"
          },
          "exercice_types": {
            "items": {
              "$ref": "#/components/schemas/ExerciceType"
            },
            "type": "array",
            "title": "Exercice Types",
            "description": "Types d'exercices contenus dans le fichier"
          },
          "exercice_type_params": {
            "additionalProperties": {
              "additionalProperties": true,
              "type": "object"
            },
            "propertyNames": {
              "$ref": "#/components/schemas/ExerciceType"
            },
            "type": "object",
            "title": "Exercice Type Params",
            "description": "Paramètres spécifiques à chaque type d'exercice"
          },
          "created_at": {
            "type": "string",
            "title": "Created At",
            "description": "Date de création du fichier (ISO format)"
          },
          "created_by": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Created By",
            "description": "Identifiant de l'utilisateur créateur"
          },
          "download_count": {
            "type": "integer",
            "title": "Download Count",
            "description": "Nombre de téléchargements",
            "default": 0
          }
        },
        "type": "object",
        "required": [
          "file_id",
          "filename",
          "filepath",
          "class_level",
          "exercice_time",
          "exercice_domain",
          "exercice_types",
          "exercice_type_params",
          "created_at"
        ],
        "title": "ExerciceFile"
      },
      "ExerciceGenerationRequest": {
        "properties": {
          "theme": {
            "type": "string",
            "title": "Theme",
            "description": "Thème des exercices à générer"
          },
          "class_level": {
            "$ref": "#/components/schemas/ExerciceLevel",
            "description": "Niveau de classe",
            "default": "ce1"
          },
          "exercice_domain": {
            "$ref": "#/components/schemas/ExerciceDomain",
            "description": "Domaine des exercices"
          },
          "exercice_time": {
            "$ref": "#/components/schemas/ExerciceTime",
            "description": "Temps estimé pour la feuille d'exercice"
          },
          "exercice_types": {
            "items": {
              "$ref": "#/components/schemas/ExerciceType"
            },
            "type": "array",
            "title": "Exercice Types",
            "default": [
              "lecture",
              "comprehension"
            ]
          },
          "exercice_type_params": {
            "anyOf": [
              {
                "additionalProperties": {
                  "additionalProperties": true,
                  "type": "object"
                },
                "propertyNames": {
                  "$ref": "#/components/schemas/ExerciceType"
                },
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Exercice Type Params",
            "description": "Paramètres spécifiques à chaque type d'exercice. Exemple : {'conjugaison': {'verbes': ['être', 'avoir'], 'temps': ['présent']}}"
          },
          "specific_requirements": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Specific Requirements",
            "description": "Exigences spécifiques"
          }
        },
        "type": "object",
        "required": [
          "theme",
          "exercice_domain",
          "exercice_time"
        ],
        "title": "ExerciceGenerationRequest"
      },
      "ExerciceLevel": {
        "type": "string",
        "enum": [
          "cp",
          "ce1",
          "ce2",
          "cm1",
          "cm2"
        ],
        "title": "ExerciceLevel"
      },
      "ExerciceResponse": {
        "properties": {
          "success": {
            "type": "boolean",
            "title": "Success",
            "description": "Indique si la génération a réussi"
          },
          "error_message": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Error Message",
            "description": "Message d'erreur en cas d'échec"
          },
          "pdf_path": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Pdf Path",
            "description": "URL de téléchargement du PDF (Azure Blob Storage ou chemin local en fallback)"
          },
          "pdf_base64": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Pdf Base64",
            "description": "Contenu du PDF encodé en base64 pour affichage direct"
          }
        },
        "type": "object",
        "required": [
          "success"
        ],
        "title": "ExerciceResponse"
      },
      "ExerciceTime": {
        "type": "string",
        "enum": [
          "20 minutes",
          "30 minutes",
          "40 minutes"
        ],
        "title": "ExerciceTime"
      },
      "ExerciceType": {
        "type": "string",
        "enum": [
          "lecture",
          "comprehension",
          "ecriture",
          "grammaire",
          "conjugaison",
          "orthographe",
          "vocabulaire",
          "calcul"
        ],
        "title": "ExerciceType",
        "description": "Types of exercises"
      },
      "HTTPValidationError": {
        "properties": {
          "detail": {
            "items": {
              "$ref": "#/components/schemas/ValidationError"
            },
            "type": "array",
            "title": "Detail"
          }
        },
        "type": "object",
        "title": "HTTPValidationError"
      },
      "LoginRequest": {
        "properties": {
          "email": {
            "type": "string",
            "format": "email",
            "title": "Email"
          },
          "code": {
            "type": "string",
            "title": "Code"
          }
        },
        "type": "object",
        "required": [
          "email",
          "code"
        ],
        "title": "LoginRequest"
      },
      "LoginResponse": {
        "properties": {
          "access_token": {
            "type": "string",
            "title": "Access Token"
          },
          "token_type": {
            "type": "string",
            "title": "Token Type"
          },
          "is_new_user": {
            "type": "boolean",
            "title": "Is New User"
          },
          "message": {
            "type": "string",
            "title": "Message"
          },
          "user_data": {
            "additionalProperties": true,
            "type": "object",
            "title": "User Data"
          }
        },
        "type": "object",
        "required": [
          "access_token",
          "token_type",
          "is_new_user",
          "message",
          "user_data"
        ],
        "title": "LoginResponse"
      },
      "LogoutResponse": {
        "properties": {
          "message": {
            "type": "string",
            "title": "Message"
          }
        },
        "type": "object",
        "required": [
          "message"
        ],
        "title": "LogoutResponse"
      },
      "RefreshRequest": {
        "properties": {
          "refresh_token": {
            "type": "string",
            "title": "Refresh Token"
          }
        },
        "type": "object",
        "required": [
          "refresh_token"
        ],
        "title": "RefreshRequest"
      },
      "RefreshResponse": {
        "properties": {
          "access_token": {
            "type": "string",
            "title": "Access Token"
          },
          "token_type": {
            "type": "string",
            "title": "Token Type"
          }
        },
        "type": "object",
        "required": [
          "access_token",
          "token_type"
        ],
        "title": "RefreshResponse"
      },
      "SendCodeRequest": {
        "properties": {
          "email": {
            "type": "string",
            "format": "email",
            "title": "Email"
          }
        },
        "type": "object",
        "required": [
          "email"
        ],
        "title": "SendCodeRequest"
      },
      "SendCodeResponse": {
        "properties": {
          "message": {
            "type": "string",
            "title": "Message"
          }
        },
        "type": "object",
        "required": [
          "message"
        ],
        "title": "SendCodeResponse"
      },
      "UpdateCustomNameRequest": {
        "properties": {
          "custom_name": {
            "type": "string",
            "title": "Custom Name",
            "description": "New custom name for the exercise file"
          }
        },
        "type": "object",
        "required": [
          "custom_name"
        ],
        "title": "UpdateCustomNameRequest"
      },
      "UpdateTagsRequest": {
        "properties": {
          "tags": {
            "items": {
              "type": "string"
            },
            "type": "array",
            "title": "Tags",
            "description": "List of tags for the exercise file"
          }
        },
        "type": "object",
        "required": [
          "tags"
        ],
        "title": "UpdateTagsRequest"
      },
      "UserCreate": {
        "properties": {
          "email": {
            "type": "string",
            "format": "email",
            "title": "Email"
          },
          "username": {
            "type": "string",
            "title": "Username"
          },
          "app_settings": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "App Settings"
          },
          "user_preferences": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Preferences"
          }
        },
        "type": "object",
        "required": [
          "email",
          "username"
        ],
        "title": "UserCreate"
      },
      "UserModel": {
        "properties": {
          "id": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Id",
            "description": "Cosmos document unique id"
          },
          "user_id": {
            "type": "string",
            "title": "User Id",
            "description": "Business-level user ID (email), also used as partition key"
          },
          "email": {
            "type": "string",
            "format": "email",
            "title": "Email",
            "description": "User's unique email address"
          },
          "username": {
            "type": "string",
            "title": "Username",
            "description": "Username or display name"
          },
          "is_active": {
            "type": "boolean",
            "title": "Is Active",
            "default": false
          },
          "access_token": {
            "type": "string",
            "title": "Access Token"
          },
          "refresh_token": {
            "type": "string",
            "title": "Refresh Token"
          },
          "token_type": {
            "type": "string",
            "title": "Token Type",
            "default": "Bearer"
          },
          "app_settings": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "App Settings",
            "description": "Application-specific settings"
          },
          "user_preferences": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Preferences",
            "description": "User preferences and configurations"
          },
          "feature_flags": {
            "anyOf": [
              {
                "additionalProperties": {
                  "type": "boolean"
                },
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Feature Flags",
            "description": "Feature flags for A/B testing or gradual rollouts"
          },
          "metadata": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata",
            "description": "Additional metadata for future use"
          },
          "created_at": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Created At"
          },
          "updated_at": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Updated At"
          },
          "last_login": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Last Login"
          }
        },
        "type": "object",
        "required": [
          "user_id",
          "email",
          "username",
          "access_token"
        ],
        "title": "UserModel",
        "description": "Unified User Model - Simple CRUD for both education and medication apps"
      },
      "UserResponse": {
        "properties": {
          "user_id": {
            "type": "string",
            "title": "User Id"
          },
          "email": {
            "type": "string",
            "title": "Email"
          },
          "username": {
            "type": "string",
            "title": "Username"
          },
          "profile_picture": {
            "type": "string",
            "title": "Profile Picture"
          }
        },
        "type": "object",
        "required": [
          "user_id",
          "email",
          "username"
        ],
        "title": "UserResponse"
      },
      "UserUpdate": {
        "properties": {
          "username": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Username"
          },
          "app_settings": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "App Settings"
          },
          "user_preferences": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "User Preferences"
          },
          "feature_flags": {
            "anyOf": [
              {
                "additionalProperties": {
                  "type": "boolean"
                },
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Feature Flags"
          },
          "metadata": {
            "anyOf": [
              {
                "additionalProperties": true,
                "type": "object"
              },
              {
                "type": "null"
              }
            ],
            "title": "Metadata"
          },
          "updated_at": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Updated At"
          },
          "last_login": {
            "anyOf": [
              {
                "type": "string"
              },
              {
                "type": "null"
              }
            ],
            "title": "Last Login"
          },
          "access_token": {
            "type": "string",
            "title": "Access Token",
            "description": "JWT access token"
          },
          "refresh_token": {
            "type": "string",
            "title": "Refresh Token",
            "description": "JWT refresh token"
          }
        },
        "type": "object",
        "required": [
          "access_token"
        ],
        "title": "UserUpdate"
      },
      "ValidationError": {
        "properties": {
          "loc": {
            "items": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "integer"
                }
              ]
            },
            "type": "array",
            "title": "Location"
          },
          "msg": {
            "type": "string",
            "title": "Message"
          },
          "type": {
            "type": "string",
            "title": "Error Type"
          }
        },
        "type": "object",
        "required": [
          "loc",
          "msg",
          "type"
        ],
        "title": "ValidationError"
      }
    },
    "securitySchemes": {
      "HTTPBearer": {
        "type": "http",
        "scheme": "bearer"
      }
    }
  }
};

// Endpoints disponibles
export const API_ENDPOINTS = {
  '_API_AUTH_SEND-CODE': '/api/auth/send-code',
  '_API_AUTH_LOGIN': '/api/auth/login',
  '_API_AUTH_ME': '/api/auth/me',
  '_API_AUTH_LOGOUT': '/api/auth/logout',
  '_API_AUTH_REFRESH': '/api/auth/refresh',
  '_API_AUTH_HEALTH': '/api/auth/health',
  '_API_HEALTH_COSMOS': '/api/health/cosmos',
  '_API_INFRA_CREATE-DATABASES-CONTAINERS': '/api/infra/create-databases-containers',
  '_API_USERS_{USER_ID}': '/api/users/{user_id}',
  '_API_USERS': '/api/users',
  '_API_EDUCATION_EXERCISES_GENERATE_{USERID}': '/api/education/exercises/generate/{userId}',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}': '/api/education/exercises/files/{user_id}',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_BY-LEVEL_{LEVEL}': '/api/education/exercises/files/{user_id}/by-level/{level}',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_BY-DOMAIN_{DOMAIN}': '/api/education/exercises/files/{user_id}/by-domain/{domain}',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_STATS': '/api/education/exercises/files/{user_id}/stats',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_{FILE_ID}': '/api/education/exercises/files/{user_id}/{file_id}',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_{FILENAME}_DOWNLOAD': '/api/education/exercises/files/{user_id}/{filename}/download',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_{FILENAME}_INCREMENT-DOWNLOAD': '/api/education/exercises/files/{user_id}/{filename}/increment-download',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_{FILE_ID}_NAME': '/api/education/exercises/files/{user_id}/{file_id}/name',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_{FILE_ID}_TAGS': '/api/education/exercises/files/{user_id}/{file_id}/tags',
  '_API_EDUCATION_EXERCISES_FILES_{USER_ID}_BY-TAGS': '/api/education/exercises/files/{user_id}/by-tags',
  '_': '/',
  '_FAVICON.ICO': '/favicon.ico'
} as const;

// URL de base (à configurer selon votre environnement)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
