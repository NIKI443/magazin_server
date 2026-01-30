import express from 'express'
import ADODB from 'node-adodb'
const router = express.Router()

// Отключение расширенных свойств для упрощения запросов
const connection = ADODB.open(
	`Provider=Microsoft.ACE.Oledb.12.0;Data Source="./src/Magazin.accdb";Persist Security Info=False;`,
	process.arch.includes('64'),
)

router.get('/products', async (req, res) => {
	try {
		const products = await connection.query('SELECT * FROM Товары')
		res.json({
			success: true,
			data: products,
		})
	} catch (error) {
		console.error('Ошибка:', error)
		res.status(500).json({
			success: false,
			message: 'Ошибка выполнения запроса',
		})
	}
})
router.post(`/product`, async (req, res) => {
	try {
		const body = req.body
		const { ID_корзины, ID_товара, Количество } = body
		const product = `INSERT INTO Товары_в_корзине (ID_корзины, ID_товара, Количество) 
      VALUES ('${ID_корзины}', '${ID_товара}', ${Количество})`

		const result = await connection.execute(product)
		const cart = await connection.query(
			`SELECT * FROM Товары_в_корзине WHERE ID_корзины = ${ID_корзины} AND ID_товара = ${ID_товара}`,
		)
		console.log(result)
		res.status(201).json({
			success: true,
			message: 'Товар добавлен в корзину',
			data: cart,
		})
	} catch (error) {
		console.error(error)
	}
})
router.get('/cart/:id', async (req, res) => {
	try {
		const id = req.params.id
		const cart = await connection.query(
			`SELECT * FROM Товары_в_корзине Orders WHERE ID_корзины = ${id}`,
		)

		const productIds = cart.map(item => item.ID_товара)
		let products
		if (productIds.length === 0) {
			console.warn('Нет валидных ID товаров')
			return res.json({
				success: false,
				data: [],
			})
		}
		const idsString = productIds.join(', ')
		products = await connection.query(
			`SELECT * FROM Товары WHERE ID_товара IN (${idsString})`,
		)

		const productsMap = new Map()
		products.forEach(product => {
			productsMap.set(product.ID_товара, product)
		})

		// Объединяем данные корзины с информацией о товарах
		const enrichedCart = cart.map(item => {
			const productInfo = productsMap.get(item.ID_товара)

			return {
				...productInfo,
				Количество: item.Количество,
				ID_товара_корзины: item.ID_товара_корзины,
			}
		})
		res.json({
			success: true,
			data: enrichedCart,
		})
	} catch (error) {
		console.error(error)
	}
})
router.post('/cart/count/:id', async (req, res) => {
	try {
		const id = req.params.id
		const body = req.body
		console.log(body)
		console.log(id)
		const updateCart = await connection.execute(
			`UPDATE Товары_в_корзине SET Количество = ${body.Количество} WHERE ID_товара_корзины = ${id}`,
		)
		res.json({
			success: true,
			data: body,
		})
	} catch (error) {
		console.error(error)
	}
})

router.delete('/cart/:id', async (req, res) => {
	try {
		const id = req.params.id
		const checkQuery = `SELECT ID_товара_корзины FROM Товары_в_корзине WHERE ID_товара_корзины = ${id}`

		const checkResult = await connection.query(checkQuery)
		console.log(id)
		if (checkResult.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Запись не найдена',
			})
		}
		const deleteQuery = await connection.execute(
			`DELETE FROM Товары_в_корзине WHERE ID_товара_корзины = ${id}`,
		)

		res.json({
			success: true,
			message: 'Товар успешно удален',
			affectedRows: deleteQuery,
		})
	} catch (error) {
		console.error(error)
	}
})

router.delete('/cartAll/:id', async (req, res) => {
	try {
		const id = req.params.id
		const checkQuery = `SELECT * FROM Товары_в_корзине WHERE ID_корзины = ${id}`

		const checkResult = await connection.query(checkQuery)

		console.log(checkResult.length === 0)
		if (checkResult.length === 0) {
			return res.status(404).json({
				success: false,
				message: 'Запись не найдена',
			})
		}
		const deleteQuery = `DELETE FROM Товары_в_корзине Orders WHERE ID_корзины = ${id}`
		const result = await connection.execute(deleteQuery)
		console.log(result)

		res.json({
			success: true,
			message: 'Товар успешно удален',
			affectedRows: result,
		})
	} catch (error) {
		console.error(error)
	}
})

export default router
