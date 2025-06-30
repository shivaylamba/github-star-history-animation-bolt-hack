# GitHub Star History Animation (Bolt Hack) - Readme generated from GH Copilot

Transform your GitHub repository's star growth into beautiful animated videos—perfect for social media sharing. 

## Features

- **Animated Star History Videos:** Automatically generate a video animation depicting the star growth of any public GitHub repository.
- **Real-time Data:** Fetch the latest star history directly from the GitHub API.
- **Customizable:** Optionally use your GitHub Personal Access Token to increase API rate limits and access private repositories.
- **Social Ready:** Videos are rendered in high resolution, ready for sharing on your favorite platforms.
- **Popular Repositories Shortcut:** Instantly try out the generator with well-known repositories like `facebook/react` or `microsoft/vscode`.

## How It Works

1. **Enter a Repository:** Input the repository in `owner/repo` format (e.g., `vercel/next.js`).
2. **(Optional) Add a GitHub Token:** Boost your API rate limit and access private repositories.
3. **Generate:** The app fetches historical star data and renders a chart animation as a downloadable video.
4. **Download & Share:** Download the `.webm` video and show off your repo's growth!

## Technologies Used

- **TypeScript / React:** Frontend interface
- **Remotion:** Video rendering
- **GitHub API:** Live repository and star data

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shivaylamba/github-star-history-animation-bolt-hack.git
   cd github-star-history-animation-bolt-hack
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the app locally:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173) (or your configured port).

## Usage

- **Input a GitHub repository** (format: `owner/repo`)
- *(Optional)* Enter a GitHub Personal Access Token for enhanced features (see [create a token](https://github.com/settings/tokens))
- Click **Generate Star History Video**
- Download and share your animated `.webm` file!

## Why Use a Personal Access Token?

- Increases API rate limit from 60 to 5,000 requests/hour
- Allows access to private repositories (with correct permissions)
- Reduces "rate limit exceeded" errors

## Example

![Example Chart Animation](https://github.com/shivaylamba/github-star-history-animation-bolt-hack/raw/main/public/example.png)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is open source. See the [LICENSE](LICENSE) file for details.

---

> **GitHub Star History Animation**  
> [shivaylamba/github-star-history-animation-bolt-hack](https://github.com/shivaylamba/github-star-history-animation-bolt-hack)
