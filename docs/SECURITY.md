# WorkFlo Security Guidelines

This document outlines security best practices and guidelines for the WorkFlo project.

## 🚨 Critical Security Issues Identified

During our security audit, the following critical issues were found and addressed:

### ⚠️ Configuration Files with Sensitive Data

**ISSUE**: The following files contained hardcoded sensitive information:
- `src/WorkFlo.Api/appsettings.json` - Database passwords, JWT secrets
- `src/WorkFlo.Api/appsettings.Development.json` - Database passwords, API keys

**RESOLUTION**: Enhanced .gitignore patterns now protect these file types.

**ACTION REQUIRED**: 
1. Move sensitive data to environment variables
2. Use the provided `.env.example` template
3. Never commit production secrets to version control

## 🔒 Sensitive Data Protection

### Files That Must NEVER Be Committed

The enhanced `.gitignore` now protects these sensitive file patterns:

#### Configuration Files
- `appsettings.Production.json`
- `appsettings.Staging.json`
- `appsettings.Local.json`
- `*.secrets.json`
- `*.local.json`
- `ConnectionStrings.config`
- `.env` files (except `.env.example`)

#### Credentials & Keys
- `**/apikeys.json`
- `**/secrets.json`
- `**/.secrets/`
- `**/keys/`
- `**/*.key`, `**/*.pem`, `**/*.p12`, `**/*.pfx`
- `**/*.crt`, `**/*.cer`
- JWT keys, OAuth configs

#### Database Files
- `*.db`, `*.sqlite`, `*.sqlite3`
- `*.mdb`, `*.accdb`
- `database.config`

#### Logs & Diagnostics
- `logs/`
- `*.log`, `*.log.*`
- `diagnostic_*.txt`

#### WorkFlo Specific
- `**/temp/`, `**/cache/`
- `PROGRESS.local.md`
- `*.private.*`
- `.workflo/secrets/`
- `workflo.secrets`

## 🛡️ Security Best Practices

### 1. Environment Variables

**DO** use environment variables for sensitive configuration:

```bash
# Copy .env.example to .env and customize
cp .env.example .env

# Set your actual values
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters
OPENAI_API_KEY=sk-your-actual-api-key
```

**DON'T** hardcode secrets in configuration files:

```json
// ❌ BAD - Never do this
{
  "ConnectionStrings": {
    "DefaultConnection": "...Password=hardcoded_password;..."
  },
  "JWT": {
    "Secret": "hardcoded_jwt_secret"
  }
}
```

### 2. Configuration File Structure

**Recommended appsettings.json structure (no secrets):**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "${DB_CONNECTION_STRING}",
    "AnalyticsConnection": "${ANALYTICS_CONNECTION_STRING}"
  },
  "JWT": {
    "Secret": "${JWT_SECRET}",
    "Issuer": "WorkFlo",
    "Audience": "WorkFlo"
  },
  "OpenAI": {
    "ApiKey": "${OPENAI_API_KEY}",
    "Model": "gpt-4o-mini"
  }
}
```

### 3. Development vs Production

**Development Settings**:
- Use placeholder/test values
- Enable in-memory databases for testing
- Use obvious fake credentials that can't be mistaken for real ones

**Production Settings**:
- Must use environment variables exclusively
- Never commit production configurations
- Use separate environment-specific configuration files

### 4. Git Security Checks

Before committing, always verify:

```bash
# Check what files will be committed
git status

# Verify no sensitive files are tracked
git ls-files | grep -E "\.(env|key|secrets)$"

# Check for accidentally tracked sensitive patterns
git log --all --grep="password\|secret\|key\|token" --oneline
```

## 🔍 Security Verification

### Testing .gitignore Effectiveness

The security implementation includes tests to verify sensitive files are properly excluded:

```bash
# Test sensitive file patterns are ignored
git check-ignore appsettings.Production.json    # Should be ignored
git check-ignore test.env                       # Should be ignored  
git check-ignore apikeys.json                   # Should be ignored
git check-ignore app.log                        # Should be ignored
```

### Regular Security Audits

Perform these checks regularly:

1. **File Scanning**: Look for sensitive patterns in tracked files
2. **History Scanning**: Check git history for accidentally committed secrets
3. **Configuration Review**: Ensure no hardcoded credentials in config files
4. **Access Controls**: Verify repository permissions and access

## 🚨 Incident Response

### If Sensitive Data is Committed

1. **Immediate Actions**:
   - Revoke/rotate any exposed credentials
   - Change affected passwords
   - Regenerate API keys

2. **Git History Cleanup**:
   ```bash
   # Remove file from history (use with caution)
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch path/to/sensitive/file' \
   --prune-empty --tag-name-filter cat -- --all
   
   # Force push to rewrite history (DANGEROUS)
   git push origin --force --all
   ```

3. **Prevention**:
   - Update .gitignore patterns
   - Add pre-commit hooks for sensitive data detection
   - Educate team members

## 📋 Security Checklist

Before any deployment or public release:

- [ ] No hardcoded passwords or API keys in code
- [ ] All production secrets use environment variables  
- [ ] .gitignore patterns cover all sensitive file types
- [ ] No sensitive data in git history
- [ ] Environment variable templates provided (.env.example)
- [ ] Database connections use secure, rotated credentials
- [ ] JWT secrets are cryptographically secure (32+ characters)
- [ ] API keys are properly scoped and rotated regularly
- [ ] Logging doesn't expose sensitive information
- [ ] Error messages don't leak sensitive details

## 🔗 Related Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [.NET Security Guidelines](https://docs.microsoft.com/en-us/dotnet/standard/security/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

## 📞 Security Contact

For security-related concerns or to report vulnerabilities:
- Create a private GitHub issue with the `security` label
- Ensure the repository remains private until issues are resolved

---

**Remember**: Security is everyone's responsibility. When in doubt, err on the side of caution and ask for review.