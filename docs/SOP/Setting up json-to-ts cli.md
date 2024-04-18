### Standard Operating Procedure (SOP) for Setting Up `qts`: A CLI Tool for Converting JSON to TypeScript Interfaces

#### Objective

To guide users through the installation and usage of `qts`, a command-line interface (CLI) tool, that simplifies the conversion of JSON objects to TypeScript interfaces. This tool aims to enhance development workflows by providing a quick means to generate type-safe interfaces from JSON data.

#### Target Audience

This SOP is intended for software developers and system administrators working on Ubuntu-based systems who need to frequently convert JSON data into TypeScript interfaces.

#### Prerequisites

- Ubuntu-based operating system.
- Access to a terminal.
- Node.js and npm installed on the system.

#### Tools and Materials Needed

- Internet connection.
- Terminal access with sufficient privileges.
- Node.js and npm.
- `jq` utility.

#### Procedure

**Step 0: Preparation**

1. Open your terminal.

2. Ensure that Node.js and npm are installed by running:

   ```bash
   node -v && npm -v
   ```

   - If these commands do not return version numbers, install Node.js and npm by executing:
     ```bash
     sudo apt update && sudo apt install nodejs npm -y
     ```

3. Install the `jq` utility, used for processing JSON:
   ```bash
   sudo apt install jq -y
   ```

**Step 1: Install `quicktype`**

1. Install `quicktype` globally using npm:
   ```bash
   npm install -g quicktype
   ```
   - This tool is used for generating TypeScript interfaces from JSON.

**Step 2: Create the `qts` Bash Script**

1. Navigate to your home directory:

   ```bash
   cd ~
   ```

2. Create a new Bash script named `qts.sh`:

   ```bash
   nano qts.sh
   ```

3. Copy and paste the following script into the nano editor:

   ```bash
   #!/bin/bash
   # Encode JSON input to handle special characters
   ENCODED_JSON=$(jq -aRs . <<< "$*")
   # Use quicktype to generate TypeScript interface
   echo $ENCODED_JSON | quicktype -s schema -l ts -o - --just-types
   ```

4. Save and close the file by pressing `CTRL+O`, `Enter`, then `CTRL+X`.

**Step 3: Make the Script Executable**

1. Make `qts.sh` executable:
   ```bash
   chmod +x ~/qts.sh
   ```

**Step 4: Enable Global Access**

1. Create a symbolic link to the script in `/usr/local/bin` for global execution:
   ```bash
   sudo ln -s ~/qts.sh /usr/local/bin/qts
   ```

**Step 5: Test the Tool**

1. Open a new terminal window or tab.

2. Test the `qts` tool by converting a sample JSON object to a TypeScript interface:
   ```bash
   qts '{"name":"John", "age":30}'
   ```
   - You should see the TypeScript interface output in the terminal.

#### Troubleshooting

- **Command Not Found**: Ensure the symbolic link was created correctly in `/usr/local/bin`. Verify by checking the link:
  ```bash
  ls -l /usr/local/bin/qts
  ```
- **Permission Denied**: Make sure `qts.sh` is executable. If not, rerun the `chmod +x ~/qts.sh` command.

#### Conclusion

Following these steps should set up the `qts` CLI tool on your system, allowing you to efficiently convert JSON data into TypeScript interfaces directly from your terminal. This tool can significantly speed up the development process by automating the creation of type-safe interfaces, leading to cleaner and more maintainable code.

#### Feedback

"Nice CLI, will try it out" - Feel free to share your experience or suggest improvements to enhance the tool's functionality further.
