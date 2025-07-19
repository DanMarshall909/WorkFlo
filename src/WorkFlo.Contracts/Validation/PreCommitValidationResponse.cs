namespace WorkFlo.Contracts.Validation;

public class PreCommitValidationResponse
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new List<string>();
}