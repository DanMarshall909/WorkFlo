namespace WorkFlo.Contracts.Validation;

public class PrePushValidationRequest
{
    public string LocalRef { get; set; }
    public string LocalSha { get; set; }
    public string RemoteRef { get; set; }
    public string RemoteSha { get; set; }
}