from decimal import Decimal

from django.db.models import Q
from rest_framework import serializers

from .models import Account, Transaction


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["id", "name", "balance", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class TransactionHistorySerializer(serializers.ModelSerializer):
    direction = serializers.SerializerMethodField()
    counterparty = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "direction",
            "counterparty",
            "created_at",
        ]

    def get_direction(self, obj: Transaction) -> str:
        account_id = self.context["account_id"]
        return "DEBIT" if obj.source_account_id == account_id else "CREDIT"

    def get_counterparty(self, obj: Transaction) -> dict:
        account_id = self.context["account_id"]
        other = (
            obj.destination_account
            if obj.source_account_id == account_id
            else obj.source_account
        )
        return {"id": other.id, "name": other.name}


class AccountDetailSerializer(AccountSerializer):
    transactions = serializers.SerializerMethodField()

    class Meta(AccountSerializer.Meta):
        fields = AccountSerializer.Meta.fields + ["transactions"]

    def get_transactions(self, obj: Account):
        txns = (
            Transaction.objects.filter(
                Q(source_account=obj) | Q(destination_account=obj)
            )
            .select_related("source_account", "destination_account")
            .order_by("-created_at", "-id")
        )
        return TransactionHistorySerializer(
            txns,
            many=True,
            context={"account_id": obj.id},
        ).data


class TransferSerializer(serializers.Serializer):
    source_account_id = serializers.IntegerField()
    destination_account_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_amount(self, value: Decimal) -> Decimal:
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0.")
        return value

    def validate(self, attrs):
        if attrs["source_account_id"] == attrs["destination_account_id"]:
            raise serializers.ValidationError(
                "Source and destination accounts must be different."
            )
        return attrs


class TransferResponseSerializer(serializers.ModelSerializer):
    source_account = serializers.SerializerMethodField()
    destination_account = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "created_at",
            "source_account",
            "destination_account",
        ]

    def get_source_account(self, obj: Transaction):
        return {
            "id": obj.source_account.id,
            "name": obj.source_account.name,
            "balance": obj.source_account.balance,
        }

    def get_destination_account(self, obj: Transaction):
        return {
            "id": obj.destination_account.id,
            "name": obj.destination_account.name,
            "balance": obj.destination_account.balance,
        }
