# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]: Sign in
        - generic [ref=e7]: Welcome back to Finbers Link. Enter your credentials to continue.
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]:
            - text: Email
            - textbox "Email" [ref=e11]:
              - /placeholder: you@example.com
          - generic [ref=e12]:
            - generic [ref=e13]:
              - generic [ref=e14]: Password
              - link "Forgot password?" [ref=e15] [cursor=pointer]:
                - /url: /forgot-password
            - generic [ref=e16]:
              - textbox "Password" [ref=e17]:
                - /placeholder: ••••••••
              - button "Show password" [ref=e18] [cursor=pointer]:
                - img [ref=e19]
          - button "Sign in" [ref=e22] [cursor=pointer]
        - paragraph [ref=e23]:
          - text: No account?
          - link "Sign up" [ref=e24] [cursor=pointer]:
            - /url: /register
  - alert [ref=e25]
```