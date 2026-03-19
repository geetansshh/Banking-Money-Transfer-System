from django.db import transaction
from rest_framework import generics, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Account, Transaction
from .serializers import (
    AccountDetailSerializer,
    AccountSerializer,
    TransferResponseSerializer,
    TransferSerializer,
)


class AccountListCreateAPIView(generics.ListCreateAPIView):
    queryset = Account.objects.all().order_by("id")
    serializer_class = AccountSerializer


class AccountRetrieveAPIView(generics.RetrieveAPIView):
    queryset = Account.objects.all()
    serializer_class = AccountDetailSerializer


class TransferCreateAPIView(APIView):
    def post(self, request):
        serializer = TransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        source_id = serializer.validated_data["source_account_id"]
        destination_id = serializer.validated_data["destination_account_id"]
        amount = serializer.validated_data["amount"]

        with transaction.atomic():
            # Lock rows in a stable order to avoid deadlocks.
            account_ids = sorted([source_id, destination_id])
            locked_accounts = {
                account.id: account
                for account in Account.objects.select_for_update().filter(
                    id__in=account_ids
                )
            }

            source = locked_accounts.get(source_id)
            destination = locked_accounts.get(destination_id)

            if not source or not destination:
                raise serializers.ValidationError("Account not found.")

            if source.balance < amount:
                raise serializers.ValidationError(
                    "Insufficient balance for this transfer."
                )

            source.balance -= amount
            destination.balance += amount
            source.save(update_fields=["balance", "updated_at"])
            destination.save(update_fields=["balance", "updated_at"])

            transfer = Transaction.objects.create(
                source_account=source,
                destination_account=destination,
                amount=amount,
            )

        payload = TransferResponseSerializer(transfer).data
        return Response(payload, status=status.HTTP_201_CREATED)
