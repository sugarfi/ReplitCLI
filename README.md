# ReplitCLI
[![Run on Repl.it](https://repl.it/badge/github/sugarfi/ReplitCLI)](https://repl.it/github/sugarfi/ReplitCLI)
ReplitCLI is a CLI to interact with Repl.it. It uses Crosis, the repl.it API, to run, read, and write files in a repl from the command line. This allows you to have work stored locally on your computer and deploy effortlessly to repl.it. Note that this app is still in beta, and you may experience some bugs. If that happens, and it will, simply open an issue.
# Usage
ReplitCLI is designed to be used like git, with push and pull commands to manipulate stuff. Before you can do any of that, though, you must install it. Simply run:
```
sudo npm install -g replitcli
```
This should install the latest version. To test your installation, run:
```
replitcli hello
```
You should see a friendly greeting. If not, open an issue here. Otherwise, you can begin using the tool. The first thing you can do is get information about a repl. Simply run:
```
replitcli info sugarfi/Hello
```
This will give you information about the repl sugarfi/Hello. All repl names take this same format: `user/replname`. Suppose now you wanted to pull the repl. You could just do:
```
replitcli pull sugarfi/Hello
```
This creates a new folder `Hello/`, and downloads the repl to it. The next thing you can do is run this repl. You can simply run:
```
replitcli run sugarfi/Hello
```
This will run the repl, and put the output in a terminal. You can also get a shell on the repl by running:
```
replitcli bash sugarfi/Hello
```
Then, you can use the normal bash commands to navigate the repl. Finally, the last thing replitcli can do (right now) is push to a repl. First, you must run:
```
replitcli init <key>
```
Where `key` is your Crosis API key. (that is required to push to repls, sorry!). Now you have a .repl directory for replitcli to work in. Then, you should edit some files to push to the repl. For each file you edit, use:
```
replitcli add <filename>
```
to add it. Once you are done, run:
```
replitcli push <your repl>
```
That's it! Your files have been pushed. Note that after adding a file once, you do not need to add it again. It will be pushed whenever you push. If you want to clear the list of files, use:
```
replitcli clear
```
That is all replitcli can do at the moment, and it is still buggy. However, I plan to edit and develop it more in the future.  This is free software, and can be used however, whenever, and whyever you want, but credit is nice. Feel free to make changes or leave feedback and issues here, on repl.it, or on the repl.it discord.
