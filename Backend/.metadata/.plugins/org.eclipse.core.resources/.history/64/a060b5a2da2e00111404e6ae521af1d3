package com.example.foodapp.service.serviceimpl;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.foodapp.entity.CartItem;
import com.example.foodapp.entity.Order;
import com.example.foodapp.entity.OrderItem;
import com.example.foodapp.entity.User;
import com.example.foodapp.repository.CartRepository;
import com.example.foodapp.repository.OrderItemRepository;
import com.example.foodapp.repository.OrderRepository;
import com.example.foodapp.repository.UserRepository;
import com.example.foodapp.service.OrderService;

@Service
public class OrderServiceImpl implements OrderService {

    @Autowired
    private CartRepository cartRepo;

    @Autowired
    private OrderRepository orderRepo;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private OrderItemRepository orderItemRepo;

    @Override
    public Order placeOrder(HttpSession session, Double grandTotal) {

        // 🔹 Get logged-in user from session
        User user = (User) session.getAttribute("user");

        if (user == null) {
            throw new RuntimeException("User not logged in");
        }

        // 🔹 Fetch full user from DB
        User fullUser = userRepo.findById(user.getId()).orElseThrow();

        // 🔹 Get cart items
        List<CartItem> cartItems = cartRepo.findByUser(fullUser);

        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        // 🔹 Calculate subtotal
        double subtotal = cartItems.stream()
                .mapToDouble(c -> c.getFoodItem().getPrice() * c.getQuantity())
                .sum();

        // 🔹 Use frontend grand total (includes tax + delivery)
        double total = (grandTotal != null && grandTotal > 0) ? grandTotal : subtotal;

        // 🔹 Create Order
        Order order = new Order();
        order.setUser(fullUser);
        order.setTotalAmount(total); // ✅ Updated total
        order.setStatus("PLACED");
        order.setAddress(fullUser.getAddress());
        order.setCreatedAt(LocalDateTime.now().toString());

        Order savedOrder = orderRepo.save(order);

        // 🔹 Save Order Items
        for (CartItem cart : cartItems) {
            OrderItem item = new OrderItem();
            item.setOrder(savedOrder);
            item.setFoodItem(cart.getFoodItem());
            item.setQuantity(cart.getQuantity());

            orderItemRepo.save(item);
        }

        // 🔹 Send Email
        try {
            sendOrderEmail(
                    fullUser.getEmail(),
                    fullUser.getName(),
                    total,
                    fullUser.getAddress()
            );
        } catch (Exception e) {
            System.out.println("Email failed but order saved");
        }

        // 🔹 Clear Cart
        cartRepo.deleteAll(cartItems);

        return savedOrder;
    }

    // 🔹 Email Method (unchanged)
    private void sendOrderEmail(String toEmail, String name, double total, String address) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("anujaghosal85@gmail.com");
        message.setTo(toEmail);
        message.setSubject("Order Confirmed!");

        String body = "Hello " + name +
                "\n\nYour order has been placed successfully!" +
                "\nTotal Amount: ₹" + total +
                "\nDelivery Address: " + address +
                "\n\nThank you for ordering!";

        message.setText(body);

        mailSender.send(message);
    }

	@Override
	public Order placeOrder(User user) {
		// TODO Auto-generated method stub
		return null;
	}
}