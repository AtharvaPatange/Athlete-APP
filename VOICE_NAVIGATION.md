# Voice Navigation System

## Overview
The Athlete App now includes comprehensive voice navigation capabilities, allowing users to navigate the entire application using speech commands. This feature enhances accessibility and provides hands-free interaction for athletes, coaches, and administrators.

## Features

### 🎤 Speech Recognition
- Real-time speech-to-text conversion
- High accuracy command recognition (70%+ confidence threshold)
- Continuous listening with auto-stop after 30 seconds
- Browser compatibility detection

### 🗣️ Text-to-Speech Feedback
- Audio confirmation of executed commands
- Voice guidance for available commands
- Customizable voice feedback settings
- Error notification sounds

### 🎯 Command Categories

#### Navigation Commands
- `"go to dashboard"` - Navigate to main dashboard
- `"go to chat"` / `"go to community"` - Open community chat
- `"go to coach"` - Access coach dashboard
- `"go to athlete"` - View athlete profile
- `"go to admin"` - Access admin panel
- `"go home"` - Return to homepage

#### Dashboard Commands
- `"go to overview"` - Switch to overview tab
- `"go to performance"` - Switch to performance tab
- `"go to transparency"` - Switch to transparency tab

#### Coach Dashboard Commands
- `"go to athletes"` - View regional athletes
- `"go to analytics"` - Access analytics dashboard
- `"go to injuries"` - Manage injury reports
- `"toggle availability"` - Change availability status

#### Control Commands
- `"help"` / `"show commands"` - Display available commands
- `"stop listening"` - Disable voice recognition
- `"log out"` / `"logout"` - Sign out of application

#### Account Commands
- `"log out"` / `"logout"` - Sign out from the application

## Usage Instructions

### 1. Activation
- Click the green microphone button in the bottom-right corner
- Button will turn red and pulse when actively listening
- Status text will show "Listening..." when active

### 2. Speaking Commands
- Speak clearly and naturally
- Wait for command confirmation
- Commands are case-insensitive
- Partial matching supported (70% word match threshold)

### 3. Audio Feedback
- Toggle the speaker icon to enable/disable voice feedback
- System will confirm executed commands
- Error messages are spoken aloud
- Click the help icon (?) to see all available commands

### 4. Visual Feedback
- Real-time transcript display while listening
- Confidence percentage indicator
- Last executed command confirmation
- Error messages with troubleshooting hints

## Technical Implementation

### Files Created/Modified:

#### Core Hook
- `src/hooks/useVoiceNavigation.ts` - Main voice navigation logic with speech recognition, command processing, and text-to-speech

#### Components
- `src/components/VoiceNavigationComponent.tsx` - UI component with microphone controls, help modal, and visual feedback

#### Pages Updated
- `src/app/dashboard/page.tsx` - Added voice navigation with dashboard-specific commands
- `src/app/coach/page.tsx` - Added coach-specific voice commands and event listeners

### Browser Compatibility
- Chrome/Chromium-based browsers: Full support
- Firefox: Limited support
- Safari: Partial support
- Edge: Full support
- Mobile browsers: Limited support

### Security & Privacy
- No voice data is stored or transmitted
- All processing happens locally in browser
- Uses browser's native Web Speech API
- No external services required

## Troubleshooting

### Common Issues:

1. **"Speech recognition not supported"**
   - Use Chrome, Edge, or Chromium-based browser
   - Enable microphone permissions
   - Try reloading the page

2. **Commands not recognized**
   - Speak clearly and at normal pace
   - Ensure quiet environment
   - Check available commands in help modal
   - Try alternative phrasings

3. **No audio feedback**
   - Check speaker/volume settings
   - Enable voice feedback (speaker icon)
   - Verify browser audio permissions

4. **Microphone access denied**
   - Allow microphone permissions in browser
   - Check system microphone settings
   - Restart browser if needed

## Future Enhancements
- Multi-language support
- Custom command creation
- Voice shortcuts for specific actions
- Integration with form inputs
- Advanced command aliases
- Voice-controlled data entry

## Accessibility Benefits
- Hands-free navigation for physical disabilities
- Reduced screen time dependency
- Improved user experience for multitasking
- Enhanced accessibility compliance
- Support for various interaction preferences