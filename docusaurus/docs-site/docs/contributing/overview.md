---
sidebar_position: 1
---

# Contributing to Blinkpay

Learn how to contribute to the Blinkpay project, whether you're fixing bugs, adding features, or improving documentation.

## Ways to Contribute

### Code Contributions

- **Bug Fixes**: Identify and fix issues in the codebase
- **New Features**: Implement new functionality following our guidelines
- **Performance Improvements**: Optimize existing code
- **Security Enhancements**: Improve security measures

### Non-Code Contributions

- **Documentation**: Improve docs, add examples, fix typos
- **Testing**: Write tests, report bugs, verify fixes
- **Design**: UI/UX improvements and suggestions
- **Community**: Help other users, moderate discussions

### Reporting Issues

- **Bug Reports**: Use GitHub issues with detailed information
- **Feature Requests**: Propose new features with use cases
- **Security Issues**: Report privately using our security policy

## Development Setup

### Prerequisites

Before contributing code:

```bash
# Required tools
Node.js >= 18.0.0
Rust >= 1.70.0
Anchor >= 0.32.0
Solana CLI >= 1.18.0
Git >= 2.30.0
```

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/blinkpay.git
   cd blinkpay
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/blinkpay/blinkpay.git
   ```

### Environment Setup

```bash
# Install dependencies
npm install
cd system && yarn install

# Set up pre-commit hooks
npm run prepare
```

## Development Workflow

### 1. Choose an Issue

- Check [GitHub Issues](https://github.com/blinkpay/blinkpay/issues) for open tasks
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-number-description
```

### 3. Make Changes

Follow our coding standards:

- **Rust/Solana**: Follow Anchor and Rust best practices
- **TypeScript/React**: Use ESLint and Prettier
- **Commits**: Write clear, descriptive commit messages
- **Tests**: Add tests for new functionality

### 4. Test Your Changes

```bash
# Run smart contract tests
cd system && anchor test

# Run frontend tests
cd ../frontend && npm test

# Manual testing
npm run dev  # Start development server
```

### 5. Submit a Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR** on GitHub:
   - Use descriptive title and description
   - Reference related issues
   - Provide testing instructions

3. **Address feedback** from reviewers

## Coding Standards

### Rust/Smart Contract

```rust
// Use proper naming conventions
#[derive(Accounts)]
pub struct CreatePaymentRequest<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + PaymentRequest::LEN,
        seeds = [b"payment_request", ...],
        bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,
}

// Add comprehensive error handling
require!(amount > 0, BlinkpayError::InvalidAmount);

// Use descriptive variable names
let current_timestamp = Clock::get()?.unix_timestamp;
```

### TypeScript/React

```typescript
// Use TypeScript strictly
interface PaymentRequest {
  id: string
  amount: number
  token: 'SOL' | 'PYUSD'
  status: PaymentStatus
}

// Follow React best practices
const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose }) => {
  const [amount, setAmount] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implementation
  }

  return (
    // JSX implementation
  )
}
```

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

**Examples:**
```
feat(payment): add support for PYUSD token

fix(wallet): resolve connection timeout issue

docs(api): update payment request examples
```

## Testing Guidelines

### Smart Contract Tests

```typescript
describe('PaymentRequest', () => {
  it('should create payment request', async () => {
    // Setup
    const amount = new anchor.BN(1000000)
    const tokenMint = NATIVE_MINT

    // Execute
    await program.methods
      .createPaymentRequest(amount, tokenMint, recipient, memo, timestamp)
      .accounts({ ...accounts })
      .rpc()

    // Verify
    const paymentRequest = await program.account.paymentRequest.fetch(pda)
    expect(paymentRequest.amount.eq(amount)).toBe(true)
  })
})
```

### Frontend Tests

```typescript
describe('PaymentModal', () => {
  it('should validate required fields', async () => {
    render(<PaymentModal open={true} onClose={jest.fn()} />)

    const submitButton = screen.getByRole('button', { name: /send payment/i })
    fireEvent.click(submitButton)

    expect(await screen.findByText('Amount is required')).toBeInTheDocument()
  })
})
```

### Test Coverage

- **Smart Contract**: Aim for 90%+ coverage
- **Frontend**: Aim for 80%+ coverage
- **Integration**: Test user workflows end-to-end

## Pull Request Process

### Before Submitting

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### PR Template

Use this structure for PR descriptions:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test the changes

## Screenshots (if applicable)
Before/after screenshots for UI changes

## Related Issues
Fixes #123, Addresses #456
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Team members review code
3. **Testing**: Manual testing may be required
4. **Approval**: PR approved and merged

## Community Guidelines

### Communication

- Be respectful and inclusive
- Use clear, concise language
- Provide constructive feedback
- Help newcomers learn

### Issue Reporting

When reporting bugs:

```markdown
## Bug Report

**Description:**
What happened?

**Steps to reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected behavior:**
What should have happened?

**Environment:**
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 100]
- Wallet: [e.g., Phantom 22.0]

**Additional context:**
Any other information
```

### Feature Requests

When requesting features:

```markdown
## Feature Request

**Problem:**
What's the problem this feature solves?

**Solution:**
Describe the solution

**Alternatives:**
Any alternative solutions considered?

**Use case:**
Who would use this and how?
```

## Recognition

Contributors are recognized through:

- **GitHub Contributors**: Listed in repository
- **Changelog**: Mentioned in release notes
- **Discord**: Special contributor role
- **Swag**: Occasional contributor rewards

## Getting Help

- **Discord**: Join our developer community
- **GitHub Discussions**: Ask questions and get help
- **Documentation**: Check our detailed guides
- **Issues**: Search existing issues first

## Code of Conduct

We follow a code of conduct to ensure a welcoming environment:

- **Respect**: Treat everyone with respect
- **Inclusion**: Welcome people from all backgrounds
- **Collaboration**: Work together constructively
- **Accountability**: Take responsibility for your actions

Violations can be reported privately to maintainers.

---

Thank you for contributing to Blinkpay! Your efforts help build a better payment platform for everyone. 🚀