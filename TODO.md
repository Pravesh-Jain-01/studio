# SoftSaath Project TODO

This file tracks the remaining tasks to complete the basic functionality of the SoftSaath e-commerce store.

### High Priority
- [ ] **Re-implement Product Image Uploads**: Add a robust image upload feature to the admin product form, allowing admins to upload multiple images from their local system to Firebase Storage.

### Medium Priority
- [ ] **Fix Collection Combobox**: The combobox for selecting a product collection in the admin form should allow admins to type and create a new collection if it doesn't already exist.

### Completed
- [x] **Implement Admin Product Deletion**: The "Delete" button on the `/admin/products` page is wired up with a confirmation dialog.
- [x] **Implement Admin Order Management**: The `/admin/orders` page now fetches and displays a list of all orders from all customers, and allows status updates.
- [x] **Enhance Admin Dashboard**: The main admin dashboard at `/admin` now displays dynamic statistics (total sales, new users, recent orders).
- [x] **Implement Inventory Management**: The app automatically decrements stock on purchase, and a new `/admin/inventory` page allows manual stock updates.
- [x] **Activate Newsletter Subscription**: The "join the club" email subscription form on the homepage is connected to a Firestore collection.
