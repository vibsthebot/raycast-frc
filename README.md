# Raycast FRC

Statistics for FIRST Robotics Competition right at your fingertips.

<img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/0d15ad05e4eaf6b5ec2b91cb9c475db996869eba_screenshot_2025-08-14_at_5.14.54___pm.png" width="300"/> <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/9f1a13dfedd656d626140f501add372e6d1b7b92_screenshot_2025-08-14_at_5.15.01___pm.png" width="300"/>

## Demo



https://github.com/user-attachments/assets/1bcfa56b-6018-4a30-8346-fc532a395282



## Features

- Search for FRC teams and events directly from Raycast
- View team stats, event results, awards, and rankings
- Specify a year for team history (optional)
- Beautiful, readable tables for matches and rankings
- Uses The Blue Alliance and Statbotics APIs

## Installation
> This extension is not yet available on the Raycast Store, so you will have to manually install it using the command line. 
```bash
git clone https://github.com/vibsthebot/raycast-frc.git
cd raycast-frc

npm install
npm run build
```
Run the extension in raycast and enter your The Blue Alliance API Key (get one from https://www.thebluealliance.com/account).

## Commands

- **FRC Team**: Get data about a team, including the competitions it competed in, its epa (estimated points average), and its location (optionally specify a year to get the team's data in previous years).
- **FRC Event**: Get event data including rankings, awards, and matches using the event key (e.g., `2025casj`, which corresponds to the 2025 Silicon Valley Regional).
