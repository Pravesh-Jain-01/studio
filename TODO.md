# SoftSaath Project TODO

This file tracks the remaining tasks to complete the basic functionality of the SoftSaath e-commerce store.

### High Priority
- [ ] **Implement Admin Product Deletion**: The "Delete" button on the `/admin/products` page needs to be wired up. This should include a confirmation dialog to prevent accidental deletions.
- [ ] **Implement Admin Order Management**: The `/admin/orders` page is currently a static placeholder. It needs to be updated to fetch and display a list of all orders from all customers. This requires updating Firestore security rules to grant admins the necessary permissions.

### Medium Priority
- [ ] **Activate Newsletter Subscription**: The "join the club" email subscription form on the homepage needs to be connected to a backend service or Firestore collection to store subscriber emails.
- [ ] **Enhance Admin Dashboard**: The main admin dashboard at `/admin` should be updated to display dynamic statistics (e.g., total sales, new users, recent orders) to provide a useful overview of the store's performance.
