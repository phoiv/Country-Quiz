

// returns Promise of country data
function getCountryData(countryCode) {
    return new Promise((resolve, reject) => {

        get = fetch(`https://restcountries.eu/rest/v2/alpha/${countryCode}`)
            .then(resp => {
                if (resp.status == 200) {
                    return resp.json();
                }
                else reject(new Error(resp.status));
            })
            .then(data => {
                resolve(data)
            })
            .catch(error => console.log(error))

    });
}

//returns the code3 of a country from the countries.js object
function getRandomCountry() {
    return countryObjects[Math.floor(Math.random() * countryObjects.length)].code3
}

document.addEventListener("DOMContentLoaded", () => {

    console.log("LOADED...")
    const game = new Game()

});

class Game {

    static scoreDisplay = document.querySelector(".score span")
    static roundDisplay = document.querySelector(".round span")
    static newRoundBtn = document.querySelector("#btn-new-round")
    static progressBar = document.querySelector(".bar")
    static overlay = document.querySelector(".overlay")
    static newGameBtn = document.querySelector("#btn-new-game")

    constructor() {
        this.round = 0
        this.score = 0
        this.taken = []
        this.correct = 0
        this.wrong = 0
        this.myRound = null
        this.newGame = this.newGame.bind(this)
        Game.newGameBtn.addEventListener("click", this.newGame)
        Game.newRoundBtn.addEventListener("click", () => this.settingNewRound())
    }

    newGame() {
        console.log("click")
        //we disable the start button and reenable it only after we display the answers
        Game.newGameBtn.classList.add("loading")
        Game.newGameBtn.removeEventListener("click", this.newGame)
        console.log("NEW GAME STARTING...")
        this.round = 0
        this.score = 0
        this.taken = []
        this.updateScoreDisplay()
        this.settingNewRound()
    }


    settingNewRound() {
        console.log("NEW ROUND STARTING...FETCHING NEW COUNTRY...")
        let countryCode = getRandomCountry()
        if (this.taken.includes(countryCode)) this.settingNewRound()

        // console.log("country:", countryCode)
        getCountryData(countryCode).then(data => {
            if (data.borders.length < 1) {
                console.log("NO BORDERING COUNTRIES, FETCHING NEW COUNTRY")
                this.settingNewRound()
            }
            else {
                this.myRound = new Round(countryCode, data, this)
                this.correct = 0
                this.wrong = 0
                this.round++
                Game.overlay.classList.remove("active")
                Game.newRoundBtn.disabled = true
                this.updateProgressBar()
                this.updateRoundDisplay()
            }
        })

        // fetchCountryData(countryCode, newRound)

    }

    handleCorrectAnswer() {
        console.log("CORRECT, UPDATING SCORE AND PROGRESS...")
        this.score += 5
        this.updateScoreDisplay()
        this.correct++
        this.updateProgressBar()
        if (this.correct === this.myRound.borders.length) this.roundWon()
    }

    handleWrongAnswer() {
        console.log("WRONG, UPDATING SCORE...")
        this.score -= 3
        this.updateScoreDisplay()
        if (++this.wrong === this.myRound.borders.length) this.gameLost()

    }

    updateScoreDisplay() {
        Game.scoreDisplay.innerHTML = this.score
    }

    updateRoundDisplay() {
        Game.roundDisplay.innerHTML = this.round
    }

    updateProgressBar() {
        let newWidth = (this.correct / this.myRound.borders.length) * 100
        Game.progressBar.style.width = `${newWidth}%`
    }

    roundWon() {
        console.log("ROUND WON")
        Game.overlay.innerText = "ROUND WON!"
        Game.overlay.classList.add("active")
        Game.newRoundBtn.disabled = false
    }

    gameLost() {
        console.log("YOU LOST")
        Game.overlay.innerText = "GAME OVER!"
        Game.overlay.classList.add("active")
        this.myRound.showCorrect()
    }
}
class Round {

    static header = document.querySelector(".header")
    static gameArea = document.querySelector(".game")

    constructor(countryCode, data, game) {
        this.country = countryCode
        this.myGame = game
        this.borders = [...data.borders]
        this.myGame.taken.push(countryCode)
        console.log(`${countryCode}->${data.name} borders: ${data.borders}`)

        Round.header.innerHTML = `<img class="country-flag" src="${data.flag}" alt=""><span>${data.name}</span>`




        //EASY MODE SELLECTS RANDOM COUNTRIES 
        // while (answers.length < 3 * this.borders.length) {
        //     let newCountry = getRandomCountry()
        //     if (!answers.includes(newCountry))
        //         answers.push(newCountry)
        // }

        //HARD MODE SELECTS COUNTRIES BORDERING THE CORRECT ANSWERS
        this.answers = [...this.borders]
        this.generateAnswers(this.borders, this.borders.length * 3)
    }

    //current are the countries on current degree of distance
    //we start with current == borders, the countries that directly neighbout the original
    //each time we go deeper getting countries one degree further from original
    generateAnswers(current, goal) {

        //if current lenght is empty fill the rest with random countries
        //this can happen when a country has only lvl1 neighbours for example
        if (current.length == 0) {
            while (this.answers.length < goal) {
                console.log("NOT ENOUGH NEIGHBOURING COUNTRIES")
                let newCountry = getRandomCountry()
                if (!this.answers.includes(newCountry))
                    this.answers.push(newCountry)
            }
            this.displayAnswers()
            return
        }

        let proms = []
        current.forEach(code => {
            proms.push(getCountryData(code))
        })

        Promise.all(proms)
            .then(res => {
                //we build the next level of neighbouring countries
                let next = []
                res.forEach(countryData =>
                    countryData.borders.forEach(country => {
                        if (country != this.country && !this.answers.includes(country) && !next.includes(country))
                            next.push(country)
                    }))
                return next
            })
            .then(next => {
                //we push the next level of countries to the aswers as long as answers isnt full
                console.log("NEXT: ", next)
                next.forEach(country => {
                    if (this.answers.length < goal)
                        this.answers.push(country)
                })
                if (this.answers.length == goal) {
                    console.log("ANSWERS== ", this.answers)
                    this.displayAnswers()
                }
                else {
                    //we need to go deeper
                    this.generateAnswers(next, goal)
                }
            })
    }

    displayAnswers() {
        shuffleArray(this.answers)
        console.log('POSSIBLE ANSWERS ', this.answers)
        Round.gameArea.innerHTML = ""
        // we fetch country for each data so we can display them on page
        // use promise.all so we update the display after all fetches have been completed
        let proms = []
        this.answers.forEach(code => {
            proms.push(getCountryData(code))
        })
        Promise.all(proms)
            .then(res => res.forEach(countryData =>
                this.appendAnswer(countryData))
            )
            .then(() => {
                Game.newGameBtn.classList.remove("loading")
                Game.newGameBtn.addEventListener("click", this.myGame.newGame)
            })

        // this.answers.forEach(code => {
        //     getCountryData(code).then((data) => this.appendAnswer(code, data))
        // })
    }

    //display the answer list on the page
    appendAnswer(data) {
        let answer = document.createElement("div");
        answer.classList.add("answer");
        answer.id = data.alpha3Code
        answer.addEventListener("click", () => this.handleClick(data.alpha3Code))
        answer.innerHTML = `<img class="country-flag" src="${data.flag}" alt=""><p>${data.name}</p>`
        Round.gameArea.appendChild(answer)
    }

    showCorrect() {
        this.borders.forEach(country => {
            console.log(country)
            let countryDisplay = document.getElementById(country)
            if (!countryDisplay.classList.contains("correct"))
                countryDisplay.classList.add("missed")

        })

    }

    //handles clicking on answers
    handleClick(countryCode) {
        console.log("clicked country ->", countryCode)
        if (this.borders.includes(countryCode)) {
            this.myGame.handleCorrectAnswer()
            document.querySelector(`.answer#${countryCode}`).classList.add("correct");
        }
        else {
            this.myGame.handleWrongAnswer()
            document.querySelector(`.answer#${countryCode}`).classList.add("wrong");
        }

    }
}
