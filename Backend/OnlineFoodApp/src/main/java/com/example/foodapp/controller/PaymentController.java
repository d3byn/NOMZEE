package com.example.foodapp.controller;

import com.example.foodapp.entity.Payment;
import com.example.foodapp.entity.User;
import com.example.foodapp.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import jakarta.servlet.http.HttpSession;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PaymentController {

	@Value("${razorpay.key.id}")
	private String keyId;

	@Value("${razorpay.key.secret}")
	private String keySecret;

	@Autowired
	private PaymentRepository paymentRepo;

	@PostMapping("/create-order")
	public Map<String, Object> createOrder(@RequestBody Map<String, Object> body, HttpSession session)
			throws Exception {

		User user = (User) session.getAttribute("user");
		// Note: user can be null in test mode, that's OK

		double amount = Double.parseDouble(body.get("amount").toString());

		// DEBUG: log the keys being used (remove after testing)
		System.out.println("Using Razorpay Key ID: " + keyId);
		System.out.println("Amount in paise: " + (int) (amount * 100));

		RazorpayClient client = new RazorpayClient(keyId, keySecret);

		JSONObject orderRequest = new JSONObject();
		orderRequest.put("amount", (int) (amount * 100)); // paise
		orderRequest.put("currency", "INR");
		orderRequest.put("receipt", "nomzee_rcpt_" + System.currentTimeMillis());

		Order razorpayOrder = client.orders.create(orderRequest);
		System.out.println("Razorpay Order created: " + razorpayOrder);

		// Save to DB
		Payment payment = new Payment();
		if (user != null)
			payment.setUser(user);
		payment.setRazorpayOrderId(razorpayOrder.get("id"));
		payment.setAmount(amount);
		payment.setStatus("CREATED");
		paymentRepo.save(payment);

		Map<String, Object> response = new HashMap<>();
		response.put("orderId", razorpayOrder.get("id"));
		response.put("amount", amount);
		response.put("currency", "INR");
		response.put("keyId", keyId); // ← frontend needs this to open checkout
		return response;
	}

	@PostMapping("/verify")
	public Map<String, Object> verifyPayment(@RequestBody Map<String, String> body, HttpSession session) {

		Map<String, Object> response = new HashMap<>();
		try {
			String orderId = body.get("razorpay_order_id");
			String paymentId = body.get("razorpay_payment_id");
			String signature = body.get("razorpay_signature");

			JSONObject attrs = new JSONObject();
			attrs.put("razorpay_order_id", orderId);
			attrs.put("razorpay_payment_id", paymentId);
			attrs.put("razorpay_signature", signature);

			boolean valid = Utils.verifyPaymentSignature(attrs, keySecret);

			if (valid) {
				Payment p = paymentRepo.findByRazorpayOrderId(orderId);
				if (p != null) {
					p.setRazorpayPaymentId(paymentId);
					p.setRazorpaySignature(signature);
					p.setStatus("PAID");
					paymentRepo.save(p);
				}
				response.put("success", true);
				response.put("message", "Payment verified");
			} else {
				response.put("success", false);
				response.put("message", "Signature verification failed");
			}
		} catch (Exception e) {
			System.err.println("Payment verify error: " + e.getMessage());
			response.put("success", false);
			response.put("message", "Error: " + e.getMessage());
		}
		return response;
	}
}