"use server";

import { Prisma } from "@prisma/client";
import { CreateBusLaneData, UpdateBusLaneData } from "@/types/models/bus-lane";
import {
  handleLanguageCreation,
  handleLanguageUpdate,
} from "@/utils/language-handler";
import {
  buildFileConnections,
  buildFileUpdateOperations,
  UploadedFileInput,
} from "@/lib/helpers/file-utils";
import { normalizeLanguageFields } from "@/lib/helpers/language-utils";

type PrismaTransaction = Prisma.TransactionClient;

type BusLaneCreateData = CreateBusLaneData & {
  images?: UploadedFileInput[];
};

type BusLaneUpdateData = UpdateBusLaneData & {
  images?: UploadedFileInput[];
};

export async function createBusLaneWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: BusLaneCreateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const languagePayload = normalizeLanguageFields(data, [
    "nameFields",
    "descriptionFields",
  ] as const);
  const { nameId, descriptionId } = await handleLanguageCreation(
    languagePayload,
    tx
  );

  const imageConnections = await buildFileConnections({
    files: data.images,
    tx,
    uploadedById,
  });

  const lane = await tx.busLane.create({
    data: {
      path: data.path as Prisma.InputJsonValue,
      color: data.color,
      weight: data.weight,
      opacity: data.opacity,
      isActive: data.isActive ?? true,
      name: { connect: { id: nameId } },
      description: descriptionId
        ? { connect: { id: descriptionId } }
        : undefined,
      service: data.serviceId ? { connect: { id: data.serviceId } } : undefined,
      images: imageConnections ? { connect: imageConnections } : undefined,
      stops: data.stopIds?.length
        ? { connect: data.stopIds.map((stopId) => ({ id: stopId })) }
        : undefined,
      routes: data.routeIds?.length
        ? { connect: data.routeIds.map((routeId) => ({ id: routeId })) }
        : undefined,
    },
    include: {
      name: true,
      description: true,
      service: true,
      images: true,
      stops: { select: { id: true, nameId: true } },
      routes: { select: { id: true, nameId: true } },
    },
  });

  return lane;
}

export async function updateBusLaneWithBusinessLogic({
  data,
  tx,
  uploadedById,
}: {
  data: BusLaneUpdateData;
  tx: PrismaTransaction;
  uploadedById?: string | null;
}) {
  const {
    id,
    nameFields,
    descriptionFields,
    images,
    stopIds,
    routeIds,
    serviceId,
    ...rest
  } = data;

  if (!id) {
    throw new Error("Bus lane ID is required for update");
  }

  const existing = await tx.busLane.findUnique({
    where: { id },
    select: {
      id: true,
      deletedAt: true,
      nameId: true,
      descriptionId: true,
    },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus lane not found or has been deleted");
  }

  if (nameFields || descriptionFields) {
    const languageUpdatePayload = normalizeLanguageFields(
      {
        id,
        model: "busLane",
        ...(existing.nameId ? { nameId: existing.nameId } : {}),
        ...(existing.descriptionId
          ? { descriptionId: existing.descriptionId }
          : {}),
        ...(nameFields ? { nameFields } : {}),
        ...(descriptionFields ? { descriptionFields } : {}),
      },
      ["nameFields", "descriptionFields"] as const
    );

    await handleLanguageUpdate(languageUpdatePayload, tx);
  }

  const imagesUpdate = await buildFileUpdateOperations({
    files: images,
    tx,
    uploadedById,
  });

  const updateData: Prisma.BusLaneUpdateInput = {
    ...rest,
  };

  if (serviceId !== undefined) {
    updateData.service =
      serviceId === null || serviceId === ""
        ? { disconnect: true }
        : { connect: { id: serviceId } };
  }

  if (imagesUpdate) {
    updateData.images = imagesUpdate;
  }

  if (stopIds) {
    updateData.stops = {
      set: [],
      ...(stopIds.length
        ? { connect: stopIds.map((stopId) => ({ id: stopId })) }
        : {}),
    };
  }

  if (routeIds) {
    updateData.routes = {
      set: [],
      ...(routeIds.length
        ? { connect: routeIds.map((routeId) => ({ id: routeId })) }
        : {}),
    };
  }

  const lane = await tx.busLane.update({
    where: { id },
    data: updateData,
    include: {
      name: true,
      description: true,
      service: true,
      images: true,
      stops: { select: { id: true, nameId: true } },
      routes: { select: { id: true, nameId: true } },
    },
  });

  return lane;
}

export async function deleteBusLaneWithBusinessLogic({
  id,
  tx,
}: {
  id: string;
  tx: PrismaTransaction;
}) {
  if (!id) {
    throw new Error("Bus lane ID is required for deletion");
  }

  const existing = await tx.busLane.findUnique({
    where: { id },
    select: { id: true, deletedAt: true },
  });

  if (!existing || existing.deletedAt) {
    throw new Error("Bus lane not found or already deleted");
  }

  return tx.busLane.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
