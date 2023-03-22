const {Order, OrderDetail, User} = require("../db")
const {Op} = require('sequelize')

//Crea un pedido en la BD
const createOrder = async(description, orderDetails, userId) => {
    //Obtengo la hora actual con el objeto Date
    const dateDelivery = new Date  
    const date = dateDelivery.toLocaleString()
    let total_price = 0, i = 0
    

    while(i < orderDetails.length) {
        const orderDet = await OrderDetail.findByPk(orderDetails[i])
        total_price += orderDet.final_price
        i++
    }

    //Establesco la hora de entrega del pedido, +30 minutos
    dateDelivery.setMinutes(dateDelivery.getMinutes() + 30)  

       //creo la orden
    const newOrder = await Order.create({
        date_start: date.slice(0,9).toString(),
        time_start: date.slice(10),
        date_delivery: dateDelivery.toLocaleDateString(),
        time_delivery: dateDelivery.toLocaleTimeString(),
        total_price: total_price,
        description
    })

    //Le seteo la orden al usuario con el id que me llega por parametro
    const user = await User.findByPk(userId)
    

    const orderDetail = await OrderDetail.findAll({
        where: {
          id: {
            [Op.in]: orderDetails
          }
        }
      });
    
    await newOrder.setOrderDetails(orderDetail)
    await newOrder.setUser(user)
    return newOrder
}

//retorna todos los pedidos de la BD
const getAllOrders = async() => {
    //Traigo todos los pedidos de la base de datos
    const order = await Order.findAll({
        include: [{
            model: User,
            attributes: ['name','email'],
            as: 'User'
        },
        {
            model: OrderDetail,
            attributes: ['id','quantity','final_price'],
            as: 'OrderDetails'
        }
    ]
    })  
    return order  
}

//retorna el pedido con el id proporcionado por parametro
const getOrderById = async(id) => {
    const order = await Order.findByPk(id,{
        include: [{
            model: User,
            attributes: ['id','name','email'],
            as: 'User'
        },
        {
            model: OrderDetail,
            attributes: ['id','quantity','final_price'],
            as: 'OrderDetails'
        }
    ]
    })  
    //En caso de no encontralo
    if(!order) return { error: "Pedido no encontrado"}   
    return order 
}

//Retorna todos los pedidos de el usuario con el id pasado por parametro
const getAllOrderByUserId = async(id) => {
    const userOrder = await Order.findAll({
        where: { UserId: id },
        include: [
        {
            model: OrderDetail,
            attributes: ['id','quantity','final_price'],
            as: 'OrderDetails'
        }
    ]
    })
    if(!userOrder.length) return { error: "El usuario no tiene pedidos"}
    return userOrder
}

// Edita un pedido
const editOrder = async(id, description, total_price) => {
    //busca el pedido a modificar por id
    let order = await Order.findOne({where: { id }})
    //si lo encuentra lo modifica
    if(order){
        order = await Order.update({
            description,
            total_price
        },
        {
            where: {
                id
            }
        })
        return "Pedido modificado"
}
else return "Pedido no encontrado"
}

const deleteOrderById = async(id) => {
    const deleteOrder = await Order.findByPk(id)
    if(deleteOrder){
        await Order.destroy({ where: { id }})
    }
    else return {error: "Pedido no encontrado"}
    return "Pedido eliminado"
}

module.exports = {
    createOrder, 
    getOrderById, 
    editOrder,
    getAllOrders,
    getAllOrderByUserId,
    deleteOrderById
}