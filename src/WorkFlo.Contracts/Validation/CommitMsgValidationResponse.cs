namespace WorkFlo.Contracts.Validation;

public class CommitMsgValidationResponse
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new List<string>();
}