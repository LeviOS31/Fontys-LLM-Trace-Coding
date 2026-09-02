namespace Shared;

public enum ErrorCode
{
    ValidationError,
    DatabaseError,
    NoChanges,
    EntityNotFound,
    NoPermission,
    Unauthorized,
    FileReadError,
    InvalidRequest,
    UnsupportedFileType,
    ProjectVersionNameAlreadyExists,
    LlmError,
    NoOpenCodes,
    LlmConfigError,
}
