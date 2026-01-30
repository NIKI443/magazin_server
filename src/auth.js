import express from 'express'
import ADODB from 'node-adodb'
const router = express.Router()

// Отключение расширенных свойств для упрощения запросов
const connection = ADODB.open(
	`Provider=Microsoft.ACE.Oledb.12.0;Data Source="./src/Magazin.accdb";Persist Security Info=False;`,
	process.arch.includes('64'),
)

router.post('/login', async (req, res) => {
	try {
		const body = req.body
		const { email, password } = body
		const login = await connection.query(
			`SELECT * FROM Клиенты WHERE Почта LIKE '%${email}%' AND Пароль LIKE '%${password}%'`,
		)

		if (login.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Неверный логин или пароль',
			})
		}
		const id = login[0].ID_Клиента
		const cart = await connection.query(
			`SELECT * FROM Корзина WHERE ID_клиента =${id}`,
		)
		const user = { ...login[0], ID_корзины: cart[0].ID_корзины }
		console.log(login)
		res.json({
			success: true,
			data: user,
		})
	} catch (error) {
		console.error('Ошибка:', error)
		res.status(500).json({
			success: false,
			message: 'Ошибка выполнения запроса',
		})
	}
})
router.post('/signup', async (req, res) => {
	try {
		const body = req.body
		const { ФИ, Отчество, email, password } = body
		const regit = await connection.query(
			`SELECT * FROM Клиенты WHERE Почта LIKE '%${email}%' AND Пароль LIKE '%${password}%'`,
		)
		console.log(regit)
		if (regit.length !== 0) {
			return res.status(404).json({
				success: false,
				message: 'Пользователь уже существует',
			})
		}

		const reg = await connection.execute(
			`INSERT INTO Клиенты (ФИ, Отчество, Почта, Пароль) VALUES ('${ФИ}', '${Отчество}', '${email}', '${password}')`,
		)
		const narek = await connection.query(
			`SELECT * FROM Клиенты WHERE Почта LIKE '%${email}%' AND Пароль LIKE '%${password}%'`,
		)
		console.log(narek)

		if (narek.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Неверный логин или пароль',
			})
		}
		const id = narek[0].ID_Клиента
		const cart = await connection.execute(
			`INSERT INTO Корзина (ID_клиента) VALUES ('${id}')`,
		)
		const cartData = await connection.query(
			`SELECT * FROM Корзина WHERE ID_клиента LIKE '%${id}%'`,
		)

		const user = { ...narek[0], ID_корзины: cartData[0].ID_корзины }
		res.json({
			success: true,
			data: user,
		})
	} catch (error) {
		console.error('Ошибка:', error)
		res.status(500).json({
			success: false,
			message: 'Ошибка выполнения запроса',
		})
	}
})

export default router
