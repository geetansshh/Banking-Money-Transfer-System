from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Account(models.Model):
    name = models.CharField(max_length=100)
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.balance})"


class Transaction(models.Model):
    source_account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="outgoing_transactions",
    )
    destination_account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name="incoming_transactions",
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return (
            f"{self.source_account_id} -> {self.destination_account_id}"
            f" ({self.amount})"
        )
