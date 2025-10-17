nano .gitignore
git add .gitignore
git commit -m "Add optimized .gitignore for Node/React/Capacitor"
git push origin main
export GITHUB_TOKEN=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
git push https://SoulSyncFrequency:$GITHUB_TOKEN@github.com/SoulSyncFrequency/SoulSyncApp.git main
# 1) Uđi u pravi projekt
cd ~/storage/downloads/soulsync
# 2) (čišćenje) Ako si slučajno prije radio git u /Download, obriši taj krivi .git
rm -rf ~/storage/downloads/.git 2>/dev/null || true
# 3) Ako si .gitignore napravio u HOME (~), premjesti ga u projekt
[ -f ~/.gitignore ] && mv ~/.gitignore ./.gitignore
# 4) Provjeri da si u točnom repo-u
pwd
git rev-parse --show-toplevel
git status
# 5) Dodaj i commitaj .gitignore (u pravom repo-u)
git add .gitignore
git commit -m "Add optimized .gitignore for Node/React/Capacitor + Android/iOS/IDE"
# 6) Povuci ako treba uskladiti (da ne bude 'fetch first')
git pull origin main --no-rebase
# 7) Pushaj (s tokenom u URL da ne pita password)
git push https://SoulSyncFrequency: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@github.com/SoulSyncFrequency/SoulSyncApp.git main
# 1) U pravom repo folderu
cd ~/storage/downloads/soulsync
# 2) Napravi .gitattributes
nano .gitattributes
# 3) Napravi .env.example
nano .env.example
# 4) Dodaj i commitaj oba fajla
git add .gitattributes .env.example
git commit -m "Add .gitattributes and .env.example for CI/CD and environment setup"
# 5) Pushaj
git push https://SoulSyncFrequency:TVOJ_TOKEN@github.com/SoulSyncFrequency/SoulSyncApp.git main
git push https://SoulSyncFrequency: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@github.com/SoulSyncFrequency/SoulSyncApp.git main
git remote remove origin
git remote add origin https://SoulSyncFrequency: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@github.com/SoulSyncFrequency/SoulSyncApp.git
git push origin main
git pull origin main
