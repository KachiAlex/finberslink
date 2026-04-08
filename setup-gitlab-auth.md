# GitLab Authentication Setup

## Quick Setup with Access Token

### 1. Create GitLab Access Token
1. Go to: https://gitlab.com/-/profile/personal_access_tokens
2. Click "Add new token"
3. Set permissions:
   - ✅ `write_repository` 
   - ✅ `read_repository`
4. Set expiration (90 days recommended)
5. Copy the token (you won't see it again)

### 2. Configure Git Remote
```bash
# Replace YOUR_TOKEN with the token you copied
git remote set-url gitlab https://oauth2:YOUR_TOKEN@gitlab.com/opd.livmind/finberslink.git
```

### 3. Push to GitLab
```bash
git push gitlab temp
```

### 4. Verify
```bash
git remote -v
# Should show:
# gitlab https://oauth2:YOUR_TOKEN@gitlab.com/opd.livmind/finberslink.git (push)
```

## Alternative: GitLab CLI (Recommended)
```bash
# Install GitLab CLI
npm install -g @gitlab/cli

# Login via browser (one-time setup)
glab auth login

# Push
git push gitlab temp
```

## Benefits of Token Authentication
- ✅ No browser popup delays
- ✅ Works in automated scripts
- ✅ Faster authentication
- ✅ No timeout issues
