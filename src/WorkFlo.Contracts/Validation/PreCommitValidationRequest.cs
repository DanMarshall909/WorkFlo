namespace WorkFlo.Contracts.Validation;

public class PreCommitValidationRequest
{
    public List<string> StagedFiles { get; set; } = new List<string>();
    public string CurrentBranch { get; set; } = string.Empty;
}