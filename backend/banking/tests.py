from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Account, Transaction


class TransferFlowTests(APITestCase):
    def setUp(self):
        self.alice = Account.objects.create(name="Alice", balance=Decimal("1000.00"))
        self.bob = Account.objects.create(name="Bob", balance=Decimal("500.00"))

    def test_transfer_successfully_moves_balance_and_creates_history(self):
        response = self.client.post(
            reverse("transfer-create"),
            {
                "source_account_id": self.alice.id,
                "destination_account_id": self.bob.id,
                "amount": "200.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.alice.refresh_from_db()
        self.bob.refresh_from_db()

        self.assertEqual(self.alice.balance, Decimal("800.00"))
        self.assertEqual(self.bob.balance, Decimal("700.00"))
        self.assertEqual(Transaction.objects.count(), 1)

        detail = self.client.get(reverse("account-detail", args=[self.alice.id]))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail.data["transactions"]), 1)
        self.assertEqual(detail.data["transactions"][0]["direction"], "DEBIT")

    def test_transfer_is_blocked_when_balance_is_insufficient(self):
        response = self.client.post(
            reverse("transfer-create"),
            {
                "source_account_id": self.alice.id,
                "destination_account_id": self.bob.id,
                "amount": "5000.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Insufficient balance", str(response.data))

        self.alice.refresh_from_db()
        self.bob.refresh_from_db()
        self.assertEqual(self.alice.balance, Decimal("1000.00"))
        self.assertEqual(self.bob.balance, Decimal("500.00"))
        self.assertEqual(Transaction.objects.count(), 0)
